
-- Create roles enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'property_manager', 'property_owner', 'field_officer');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles table (separate from profiles per security requirements)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Properties table
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  property_type TEXT NOT NULL DEFAULT 'residential',
  total_units INTEGER NOT NULL DEFAULT 1,
  owner_id UUID REFERENCES auth.users(id),
  monthly_rent NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Tenants table
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  unit_number TEXT,
  rent_amount NUMERIC NOT NULL DEFAULT 0,
  balance NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  lease_start DATE,
  lease_end DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Payments table with property_id for simpler RLS
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'mpesa',
  transaction_ref TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Maintenance requests table
CREATE TABLE public.maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  created_by UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;

-- Property assignments (for field officers)
CREATE TABLE public.property_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (property_id, user_id)
);

ALTER TABLE public.property_assignments ENABLE ROW LEVEL SECURITY;

-- Security definer helper functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_property_manager()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'property_manager'
  )
$$;

CREATE OR REPLACE FUNCTION public.user_owns_property(_property_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = _property_id AND owner_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION public.is_assigned_to_property(_property_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.property_assignments
    WHERE property_id = _property_id AND user_id = auth.uid()
  )
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email
  );
  
  -- Auto-assign role from metadata
  IF NEW.raw_user_meta_data ->> 'role' IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, (NEW.raw_user_meta_data ->> 'role')::app_role);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_maintenance_updated_at BEFORE UPDATE ON public.maintenance_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies

-- Profiles: everyone authenticated can read, users update own
CREATE POLICY "Authenticated users can read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Super admins can delete profiles" ON public.profiles FOR DELETE TO authenticated USING (public.is_super_admin());

-- User roles: users see own, admins/managers see all
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_super_admin() OR public.is_property_manager());
CREATE POLICY "Super admins manage roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admins update roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.is_super_admin());
CREATE POLICY "Super admins delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.is_super_admin());

-- Properties
CREATE POLICY "Read properties" ON public.properties FOR SELECT TO authenticated
  USING (public.is_super_admin() OR public.is_property_manager() OR owner_id = auth.uid() OR public.is_assigned_to_property(id));
CREATE POLICY "Create properties" ON public.properties FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin() OR public.is_property_manager());
CREATE POLICY "Update properties" ON public.properties FOR UPDATE TO authenticated
  USING (public.is_super_admin() OR public.is_property_manager() OR owner_id = auth.uid());
CREATE POLICY "Delete properties" ON public.properties FOR DELETE TO authenticated
  USING (public.is_super_admin() OR public.is_property_manager());

-- Tenants
CREATE POLICY "Read tenants" ON public.tenants FOR SELECT TO authenticated
  USING (public.is_super_admin() OR public.is_property_manager() OR public.user_owns_property(property_id) OR public.is_assigned_to_property(property_id) OR profile_id = auth.uid());
CREATE POLICY "Create tenants" ON public.tenants FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin() OR public.is_property_manager() OR public.user_owns_property(property_id));
CREATE POLICY "Update tenants" ON public.tenants FOR UPDATE TO authenticated
  USING (public.is_super_admin() OR public.is_property_manager() OR public.user_owns_property(property_id));
CREATE POLICY "Delete tenants" ON public.tenants FOR DELETE TO authenticated
  USING (public.is_super_admin() OR public.is_property_manager() OR public.user_owns_property(property_id));

-- Payments
CREATE POLICY "Read payments" ON public.payments FOR SELECT TO authenticated
  USING (public.is_super_admin() OR public.is_property_manager() OR public.user_owns_property(property_id) OR public.is_assigned_to_property(property_id));
CREATE POLICY "Create payments" ON public.payments FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin() OR public.is_property_manager() OR public.user_owns_property(property_id));
CREATE POLICY "Update payments" ON public.payments FOR UPDATE TO authenticated
  USING (public.is_super_admin() OR public.is_property_manager() OR public.user_owns_property(property_id));
CREATE POLICY "Delete payments" ON public.payments FOR DELETE TO authenticated
  USING (public.is_super_admin() OR public.is_property_manager());

-- Maintenance requests
CREATE POLICY "Read maintenance" ON public.maintenance_requests FOR SELECT TO authenticated
  USING (public.is_super_admin() OR public.is_property_manager() OR public.user_owns_property(property_id) OR public.is_assigned_to_property(property_id) OR created_by = auth.uid());
CREATE POLICY "Create maintenance" ON public.maintenance_requests FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin() OR public.is_property_manager() OR public.user_owns_property(property_id) OR created_by = auth.uid());
CREATE POLICY "Update maintenance" ON public.maintenance_requests FOR UPDATE TO authenticated
  USING (public.is_super_admin() OR public.is_property_manager() OR public.user_owns_property(property_id) OR public.is_assigned_to_property(property_id) OR created_by = auth.uid());
CREATE POLICY "Delete maintenance" ON public.maintenance_requests FOR DELETE TO authenticated
  USING (public.is_super_admin() OR public.is_property_manager());

-- Property assignments
CREATE POLICY "Read assignments" ON public.property_assignments FOR SELECT TO authenticated
  USING (public.is_super_admin() OR public.is_property_manager() OR user_id = auth.uid());
CREATE POLICY "Create assignments" ON public.property_assignments FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin() OR public.is_property_manager());
CREATE POLICY "Delete assignments" ON public.property_assignments FOR DELETE TO authenticated
  USING (public.is_super_admin() OR public.is_property_manager());

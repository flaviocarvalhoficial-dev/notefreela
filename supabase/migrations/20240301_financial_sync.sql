-- Financial Synchronization Migrations

-- 1. Create billing_agreements table
CREATE TABLE IF NOT EXISTS public.billing_agreements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    model TEXT NOT NULL, -- '100inicio', '50_50', '100fim', 'parcelado', 'custom'
    trigger TEXT NOT NULL, -- 'immediato', 'pos_setup'
    cycle TEXT NOT NULL DEFAULT 'unico', -- 'mensal', 'unico'
    months INTEGER DEFAULT 0,
    entry_amount DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create installments table (Planned payments)
CREATE TABLE IF NOT EXISTS public.installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    billing_agreement_id UUID REFERENCES public.billing_agreements(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    due_date DATE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'provisionado', -- 'provisionado', 'atrasado', 'recebido', 'cancelado'
    origin_label TEXT, -- e.g., 'Setup - Parcela 1/3', 'Mensalidade 2/6'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create transactions table (ledger for receipts)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    installment_id UUID REFERENCES public.installments(id) ON DELETE SET NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    amount DECIMAL(12, 2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT, -- 'pix', 'boleto', 'cartao', 'dinheiro'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Audit Log table (Simple version)
CREATE TABLE IF NOT EXISTS public.finance_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id UUID NOT NULL, -- ID of installment or billing agreement
    record_type TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.billing_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_audit_logs ENABLE ROW LEVEL SECURITY;

-- Billing Agreements Policies
CREATE POLICY "Users can manage their own billing agreements"
    ON public.billing_agreements FOR ALL
    USING (auth.uid() = user_id);

-- Installments Policies
CREATE POLICY "Users can manage their own installments"
    ON public.installments FOR ALL
    USING (auth.uid() = user_id);

-- Transactions Policies
CREATE POLICY "Users can manage their own transactions"
    ON public.transactions FOR ALL
    USING (auth.uid() = user_id);

-- Audit Logs Policies
CREATE POLICY "Users can manage their own audit logs"
    ON public.finance_audit_logs FOR ALL
    USING (auth.uid() = user_id);

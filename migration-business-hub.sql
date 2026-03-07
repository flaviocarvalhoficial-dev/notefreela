-- ==========================================
-- NOTE_FREELA: BUSINESS HUB MIGRATION
-- Descrição: Tabelas, RLS e Storage para "Minha Empresa"
-- ==========================================

-- Habilitar extensão para UUID se não existir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA: Informações da Empresa
CREATE TABLE IF NOT EXISTS public.company_info (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT,
    trading_name TEXT,
    cnpj TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    pix_key TEXT,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 2. TABELA: Documentos da Empresa
CREATE TABLE IF NOT EXISTS public.company_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- 'legal', 'tax', 'identity'
    file_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABELA: Histórico de NFS-e
CREATE TABLE IF NOT EXISTS public.invoice_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month_year TEXT NOT NULL, -- MM/YYYY
    invoice_count INT DEFAULT 0,
    total_amount NUMERIC(12,2) DEFAULT 0,
    taxes_amount NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABELA: Modelos de Documentos
CREATE TABLE IF NOT EXISTS public.document_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL, -- 'contract', 'proposal', 'receipt', 'nda'
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- POLÍTICAS DE SEGURANÇA (RLS)
-- ==========================================

ALTER TABLE public.company_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;

-- Company Info
CREATE POLICY "Users can manage their own company info" ON public.company_info
    FOR ALL USING (auth.uid() = user_id);

-- Documents
CREATE POLICY "Users can manage their own company documents" ON public.company_documents
    FOR ALL USING (auth.uid() = user_id);

-- Invoices
CREATE POLICY "Users can manage their own invoices" ON public.invoice_history
    FOR ALL USING (auth.uid() = user_id);

-- Templates
CREATE POLICY "Users can manage their own templates" ON public.document_templates
    FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- STORAGE CONFIGURATION
-- ==========================================

-- Criar bucket para ativos da empresa
INSERT INTO storage.buckets (id, name, public) 
VALUES ('business-assets', 'business-assets', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso ao Storage (Restrito ao Usuário)
CREATE POLICY "Users can manage their own business assets" ON storage.objects
    FOR ALL USING (
        bucket_id = 'business-assets' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- ==========================================
-- AUTOMATION (UPDATED_AT)
-- ==========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_company_info_updated_at
    BEFORE UPDATE ON public.company_info
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

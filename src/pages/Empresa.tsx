
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Building2,
    FileText,
    ShieldCheck,
    FileSpreadsheet,
    Stamp,
    Save,
    Upload,
    ExternalLink,
    Plus,
    Copy,
    Check,
    Download,
    Eye,
    Receipt,
    FileSignature,
    Briefcase,
    X,
    Printer,
    Settings,
    Info,
    Trash2,
    Link as LinkIcon,
    Pencil,
    Image,
    Loader2,
    Maximize2,
    Minimize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Textarea
} from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

import { useCompanyData, type CompanyInfo } from "@/hooks/use-company-data";

const TEMPLATES: Record<string, any> = {
    contract: {
        id: 'contract',
        title: 'Contrato de Prestação de Serviços',
        content: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS

CONTRATADA: {{company_name}}, inscrita no CNPJ sob o nº {{cnpj}}, com sede em {{address}}.

CONTRATANTE: [NOME DO CLIENTE], inscrito no CPF/CNPJ sob o nº [DOCUMENTO], residente em [ENDEREÇO].

OBJETO: O presente contrato tem como objeto a prestação de serviços de [DESCRIÇÃO DOS SERVIÇOS] pela CONTRATADA ao CONTRATANTE.

VALOR E FORMA DE PAGAMENTO: Pelo serviço ora contratado, o CONTRATANTE pagará à CONTRATADA a importância de R$ [VALOR], via PIX (Chave: {{pix_key}}).

[DATA E ASSINATURAS]`
    },
    receipt: {
        id: 'receipt',
        title: 'Recibo de Pagamento',
        content: `RECIBO DE PAGAMENTO

RECEBEMOS de [NOME DO PAGADOR], a importância de R$ [VALOR] ([VALOR POR EXTENSO]), referente a [DESCRIÇÃO DO PAGAMENTO].

Para maior clareza firmamos o presente.

Local e Data: [CIDADE], {{date}}

{{company_name}}
CNPJ: {{cnpj}}`
    },
    proposal: {
        id: 'proposal',
        title: 'Proposta Comercial',
        content: `PROPOSTA COMERCIAL

PARA: [NOME DO CLIENTE]
DE: {{trading_name}}

Prezado(a), 

Apresentamos nossa proposta técnica e comercial para a execução de [NOME DO PROJETO].

Nossa expertise em [ÁREA] garante a entrega de um resultado sólido e orientado a [OBJETIVO].

VALOR INVESTIMENTO: R$ [VALOR]
PRAZO: [PRAZO]

Atenciosamente, 
{{company_name}}`
    },
    nda: {
        id: 'nda',
        title: 'Termo de Confidencialidade (NDA)',
        content: `ACORDO DE CONFIDENCIALIDADE

Pelo presente instrumento, {{company_name}}, adiante denominada REVELADORA, e [NOME DA PARTE], adiante denominada RECEPTORA, assumem o compromisso de manter sigilo sobre as Informações Confidenciais trocadas durante a negociação de [PROJETO].

[TERMOS DE SIGILO]`
    }
};

const Empresa = () => {
    const { toast } = useToast();
    const {
        companyInfo,
        updateInfo,
        isUpdating,
        isLoading,
        documents: dbDocs,
        invoices: dbInvoices,
        templates: dbTemplates,
        uploadDocument,
        isUploading,
        updateDocument,
        deleteDocument,
        addInvoice,
        isAddingInvoice,
        upsertTemplate,
        updateLogo,
        isUpdatingLogo,
        updateStationery,
        isUpdatingStationery
    } = useCompanyData();

    const [activeTab, setActiveTab] = useState<"info" | "docs" | "nfe" | "models">("info");
    const [copied, setCopied] = useState<string | null>(null);
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [useStationery, setUseStationery] = useState(true);
    const [isMaximized, setIsMaximized] = useState(false);

    const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
    const [editingDocument, setEditingDocument] = useState<any | null>(null);
    const [editedContent, setEditedContent] = useState("");

    // State for manual invoice
    const [invoiceForm, setInvoiceForm] = useState({
        month_year: `${new Date().getMonth() + 1}/${new Date().getFullYear()}`,
        invoice_count: 1,
        total_amount: 0,
        taxes_amount: 0
    });

    // State for generic upload
    const [uploadForm, setUploadForm] = useState({
        name: "",
        category: "Geral"
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const [formData, setFormData] = useState<CompanyInfo & { nfe_url?: string }>({
        company_name: "",
        trading_name: "",
        cnpj: "",
        email: "",
        phone: "",
        address: "",
        pix_key: "",
        nfe_url: ""
    });

    useEffect(() => {
        if (companyInfo) {
            setFormData({
                company_name: companyInfo.company_name || "",
                trading_name: companyInfo.trading_name || "",
                cnpj: companyInfo.cnpj || "",
                email: companyInfo.email || "",
                phone: companyInfo.phone || "",
                address: companyInfo.address || "",
                pix_key: companyInfo.pix_key || "",
                nfe_url: (companyInfo as any).nfe_url || ""
            });
        }
    }, [companyInfo]);

    const handleSave = () => {
        updateInfo(formData);
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) updateLogo(file);
    };

    const handleStationeryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) updateStationery(file);
    };

    const handleDocUpload = (file: File, name: string, category: string) => {
        uploadDocument({ file, name, category });
    };

    const handleUpdateDoc = () => {
        if (editingDocument) {
            updateDocument({
                id: editingDocument.id,
                name: editingDocument.name,
                category: editingDocument.category
            }, {
                onSuccess: () => setIsEditModalOpen(false)
            });
        }
    };

    const handleSaveInvoice = () => {
        addInvoice(invoiceForm, {
            onSuccess: () => setIsInvoiceModalOpen(false)
        });
    };

    const handleSaveTemplate = () => {
        upsertTemplate({
            title: selectedTemplate?.title || "Novo Modelo",
            content: editedContent
        }, {
            onSuccess: () => setIsGeneratorOpen(false)
        });
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopied(label);
        setTimeout(() => setCopied(null), 2000);
    };

    const openGenerator = (templateId: string) => {
        const template = TEMPLATES[templateId];
        if (!template) return;

        let content = template.content;
        // Replace tags
        content = content.replace(/{{company_name}}/g, formData.company_name || "[RAZÃO SOCIAL]");
        content = content.replace(/{{trading_name}}/g, formData.trading_name || "[NOME FANTASIA]");
        content = content.replace(/{{cnpj}}/g, formData.cnpj || "[CNPJ]");
        content = content.replace(/{{address}}/g, formData.address || "[ENDEREÇO]");
        content = content.replace(/{{pix_key}}/g, formData.pix_key || "[CHAVE PIX]");
        content = content.replace(/{{date}}/g, new Date().toLocaleDateString('pt-BR'));

        setSelectedTemplate(template);
        setEditedContent(content);
        setIsGeneratorOpen(true);
    };

    const tabs = [
        { id: "info", label: "Informações", icon: Building2 },
        { id: "docs", label: "Documentos", icon: ShieldCheck },
        { id: "nfe", label: "Emissão NF-e", icon: Receipt },
        { id: "models", label: "Modelos & Gerador", icon: FileSignature },
    ];

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-100px)] items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <Building2 className="h-12 w-12 text-primary/20" />
                    <p className="text-xs text-muted-foreground animate-pulse">Carregando dados da empresa...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <style>
                {`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        #printable-doc, #printable-doc * {
                            visibility: visible;
                        }
                        #printable-doc {
                            position: fixed;
                            left: 0;
                            top: 0;
                            width: 210mm;
                            height: 297mm;
                            margin: 0;
                            padding: 20mm !important;
                            background-color: white !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                            border: none !important;
                            box-shadow: none !important;
                        }
                        /* Remove scrollbars and borders for print */
                        .overflow-hidden, .overflow-y-auto {
                            overflow: visible !important;
                        }
                        /* Hide everything else specifically */
                        .flex-1, header, aside, button, .border, .fixed {
                            box-shadow: none !important;
                        }
                    }
                `}
            </style>
            {/* Header */}
            <header className="heading-container">
                <div className="flex items-center gap-3">
                    <div className="h-1 w-6 bg-primary rounded-full opacity-60" />
                    <span className="text-[10px] font-medium tracking-tight text-primary/60 uppercase">Business Center</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="stack-gap-sm">
                        <h1 className="text-3xl font-medium tracking-tight text-foreground">Minha Empresa</h1>
                        <p className="text-muted-foreground font-normal text-sm max-w-md leading-relaxed">
                            Gestão de identidade corporativa, documentos fiscais e gerador de instrumentos jurídicos.
                        </p>
                    </div>
                </div>
            </header>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 bg-muted/20 p-1 rounded-xl border border-border/50 self-start">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all",
                            activeTab === tab.id
                                ? "bg-card text-foreground shadow-sm border border-border"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                        )}
                    >
                        <tab.icon className="h-3.5 w-3.5" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="mt-4">
                <AnimatePresence mode="wait">
                    {activeTab === "info" && (
                        <motion.div
                            key="info"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                        >
                            <div className="lg:col-span-2 space-y-6">
                                <section className="bento-card p-6">
                                    <h3 className="text-sm font-semibold mb-6 flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-primary" />
                                        Identificação Jurídica
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Razão Social</label>
                                            <Input
                                                value={formData.company_name}
                                                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                                placeholder="Ex: Tech Solutions Ltda"
                                                className="bg-muted/5 border-border"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Nome Fantasia</label>
                                            <Input
                                                value={formData.trading_name}
                                                onChange={(e) => setFormData({ ...formData, trading_name: e.target.value })}
                                                placeholder="Ex: TechSol"
                                                className="bg-muted/5 border-border"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">CNPJ / CPF</label>
                                            <Input
                                                value={formData.cnpj}
                                                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                                                placeholder="00.000.000/0001-00"
                                                className="bg-muted/5 border-border"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Chave PIX (Faturamento)</label>
                                            <Input
                                                value={formData.pix_key}
                                                onChange={(e) => setFormData({ ...formData, pix_key: e.target.value })}
                                                placeholder="Email, CNPJ ou Celular"
                                                className="bg-muted/5 border-border"
                                            />
                                        </div>
                                    </div>
                                </section>

                                <section className="bento-card p-6">
                                    <h3 className="text-sm font-semibold mb-6 flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-primary" />
                                        Contato & Endereço
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email Corporativo</label>
                                            <Input
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="contato@empresa.com"
                                                className="bg-muted/5 border-border"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Telefone / WhatsApp</label>
                                            <Input
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                placeholder="(00) 00000-0000"
                                                className="bg-muted/5 border-border"
                                            />
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Endereço Fiscal</label>
                                            <Input
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                placeholder="Rua, Número, Complemento, Cidade - UF"
                                                className="bg-muted/5 border-border"
                                            />
                                        </div>
                                    </div>
                                </section>

                                <div className="flex justify-end">
                                    <Button onClick={handleSave} disabled={isUpdating} className="px-8 shadow-glow-sm min-w-[160px]">
                                        {isUpdating ? "Salvando..." : <><Save className="h-4 w-4 mr-2" /> Salvar Informações</>}
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bento-card p-6 bg-primary/5 border-primary/10">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Cartão de Visita Digital</h3>
                                    <div className="aspect-[1.6/1] bg-card border border-border rounded-xl p-5 relative overflow-hidden flex flex-col justify-between shadow-sm">
                                        <div className="flex justify-between items-start">
                                            <div className="z-10">
                                                <p className="font-bold text-sm text-foreground leading-none">{formData.trading_name || "Sua Empresa"}</p>
                                                <p className="text-[10px] text-muted-foreground mt-1">{formData.cnpj || "00.000.000/0000-00"}</p>
                                            </div>
                                            <img src="/nimbus-logo.webp" alt="Logo" className="w-6 h-6 grayscale opacity-20 z-10" />
                                        </div>

                                        <div className="space-y-1 z-10">
                                            <p className="text-[10px] flex items-center gap-2 text-muted-foreground"><Copy className="h-2.5 w-2.5" /> {formData.email || "email@exemplo.com"}</p>
                                            <p className="text-[10px] flex items-center gap-2 text-muted-foreground"><Copy className="h-2.5 w-2.5" /> {formData.phone || "(00) 00000-0000"}</p>
                                        </div>

                                        <div className="absolute -right-4 -bottom-4 bg-primary/10 w-24 h-24 rounded-full blur-2xl" />
                                        <div className="absolute -left-4 -top-4 bg-primary/5 w-16 h-16 rounded-full blur-xl" />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-4 text-center italic">Este cartão é usado em propostas e contratos automáticos.</p>
                                </div>

                                <div className="linear-card p-6 space-y-4">
                                    <h4 className="text-[11px] font-bold uppercase text-muted-foreground tracking-widest">Ações Rápidas</h4>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            id="logo-upload"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleLogoUpload}
                                        />
                                        <Button
                                            variant="outline"
                                            className="w-full text-xs justify-start gap-3 h-10 bg-muted/5 text-muted-foreground hover:text-foreground"
                                            disabled={isUpdatingLogo}
                                            onClick={() => document.getElementById('logo-upload')?.click()}
                                        >
                                            <Upload className={cn("h-4 w-4", isUpdatingLogo && "animate-bounce")} />
                                            {isUpdatingLogo ? "Enviando..." : "Alterar Logotipo"}
                                        </Button>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="w-full text-xs justify-start gap-3 h-10 bg-muted/5 text-muted-foreground hover:text-foreground"
                                        onClick={() => copyToClipboard(`${formData.company_name}\nCNPJ: ${formData.cnpj}\nPIX: ${formData.pix_key}`, 'info')}
                                    >
                                        {copied === 'info' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                        Copiar Dados p/ Faturamento
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "docs" && (
                        <motion.div
                            key="docs"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {dbDocs.length > 0 ? dbDocs.map((doc: any) => (
                                    <div key={doc.id} className="bento-card p-5 flex flex-col justify-between group h-44 transition-all hover:shadow-glow-sm">
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-start gap-4">
                                                <h4 className="text-sm font-semibold text-foreground break-words flex-1 leading-tight">
                                                    {doc.name}
                                                </h4>
                                                <Badge variant="secondary" className="text-[9px] h-4 shrink-0">Disponível</Badge>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight opacity-60">{doc.category}</p>
                                                <p className="text-[10px] text-muted-foreground italic">Adicionado em {new Date(doc.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end gap-1 mt-4">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => window.open(doc.file_url, '_blank')}
                                                className="h-8 px-2 text-[10px] gap-1.5 hover:bg-primary/5 hover:text-primary"
                                            >
                                                <Eye className="h-3 w-3" /> Ver
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setEditingDocument(doc);
                                                    setIsEditModalOpen(true);
                                                }}
                                                className="h-8 w-8 hover:bg-primary/5 hover:text-primary p-0"
                                            >
                                                <Pencil className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    const link = document.createElement('a');
                                                    link.href = doc.file_url;
                                                    link.download = doc.name;
                                                    link.click();
                                                }}
                                                className="h-8 px-2 text-[10px] gap-1.5 hover:bg-primary/5 hover:text-primary"
                                            >
                                                <Download className="h-3 w-3" /> Baixar
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => deleteDocument(doc.id)}
                                                className="h-8 w-8 text-destructive hover:bg-destructive/10 p-0"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                )) : (
                                    <>
                                        {[
                                            { title: "Contrato Social", desc: "Documento de constituição da empresa.", status: "empty" },
                                            { title: "Cartão CNPJ", desc: "Comprovante de Inscrição e Situação Cadastral.", status: "empty" },
                                            { title: "RG / CNH Sócios", desc: "Documentos de identidade para verificação.", status: "empty" },
                                        ].map((doc) => (
                                            <div key={doc.title} className="bento-card p-5 flex flex-col justify-between group h-44">
                                                <div>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="text-sm font-semibold">{doc.title}</h4>
                                                        <Badge variant="outline" className="text-[9px] h-4">Pendente</Badge>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground line-clamp-2">{doc.desc}</p>
                                                </div>
                                                <div className="flex items-center gap-2 mt-4">
                                                    <input
                                                        type="file"
                                                        id={`upload-${doc.title}`}
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) handleDocUpload(file, doc.title, "Obrigatório");
                                                        }}
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="w-full h-8 text-[10px] gap-1.5 text-primary hover:bg-primary/5 bg-primary/[0.02]"
                                                        onClick={() => document.getElementById(`upload-${doc.title}`)?.click()}
                                                    >
                                                        <Upload className="h-3 w-3" /> Fazer Upload
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}
                                <div
                                    onClick={() => setIsUploadModalOpen(true)}
                                    className="bento-card p-5 border-dashed border-primary/20 bg-primary/[0.01] flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-primary/[0.03] transition-all h-44"
                                >
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <Plus className="h-4 w-4" />
                                    </div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Adicionar Outro</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "nfe" && (
                        <motion.div
                            key="nfe"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                        >
                            <div className="lg:col-span-8 space-y-8">
                                <div className="bento-card p-8 bg-gradient-to-br from-card to-primary/[0.02]">
                                    <div className="max-w-md space-y-4">
                                        <h2 className="text-2xl font-semibold tracking-tight">Portal de Notas Fiscais</h2>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            Centralize a emissão e consulta de suas notas fiscais de serviço (NFS-e) diretamente nos sistemas governamentais.
                                        </p>
                                        <div className="flex gap-4 pt-2">
                                            <Button
                                                className="gap-2 px-6"
                                                onClick={() => formData.nfe_url ? window.open(formData.nfe_url, '_blank') : setIsLinkModalOpen(true)}
                                            >
                                                Acessar Sistema <ExternalLink className="h-4 w-4" />
                                            </Button>
                                            <Button variant="outline" className="gap-2" onClick={() => setIsLinkModalOpen(true)}>
                                                Configurar Link <Settings className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold flex items-center gap-2">
                                        <FileSpreadsheet className="h-4 w-4 text-primary" />
                                        Histórico de Emissões (Sincronizado)
                                    </h3>
                                    <div className="bento-card overflow-hidden">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="bg-muted/30 border-b border-border">
                                                    <th className="p-4 font-bold text-muted-foreground uppercase tracking-wider">Mês / Ano</th>
                                                    <th className="p-4 font-bold text-muted-foreground uppercase tracking-wider">Total NF</th>
                                                    <th className="p-4 font-bold text-muted-foreground uppercase tracking-wider">Valor total</th>
                                                    <th className="p-4 font-bold text-muted-foreground uppercase tracking-wider">Impostos (Est.)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {dbInvoices.length > 0 ? dbInvoices.map((inv: any) => (
                                                    <tr key={inv.id} className="border-b border-border">
                                                        <td className="p-4 font-medium">{inv.month_year}</td>
                                                        <td className="p-4 font-medium">{inv.invoice_count}</td>
                                                        <td className="p-4 font-medium text-emerald-500">R$ {inv.total_amount.toLocaleString('pt-BR')}</td>
                                                        <td className="p-4 font-medium text-rose-500">R$ {inv.taxes_amount.toLocaleString('pt-BR')}</td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan={4} className="p-8 text-center text-muted-foreground italic">Nenhum registro de faturamento encontrado.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                        <div className="p-3 bg-muted/10 text-center">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-[10px] font-bold uppercase tracking-widest gap-2"
                                                onClick={() => setIsInvoiceModalOpen(true)}
                                            >
                                                <Plus className="h-3 w-3" /> Registrar Emissão Manual
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-4 space-y-6">
                                <div className="linear-card p-6 bg-primary/[0.02] border-primary/10">
                                    <div className="flex items-center gap-2 text-primary mb-4">
                                        <Info className="h-4 w-4" />
                                        <h4 className="text-xs font-bold uppercase tracking-wider">Lembrete Fiscal</h4>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                        Não esqueça de emitir a nota fiscal no momento do recebimento para evitar multas. O Nimbus não emite a nota automaticamente, ele serve como ponte e registro histórico.
                                    </p>
                                </div>

                                <div className="bento-card p-6">
                                    <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-widest mb-4">Utilitários NF</h4>
                                    <div className="space-y-3">
                                        {['Portal NFS-e SP', 'Portal NFS-e Nacional', 'Consulta CNPJ'].map(link => (
                                            <a key={link} href="#" className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-primary/5 border border-border transition-colors text-xs font-medium">
                                                {link} <ExternalLink className="h-3 w-3 opacity-40" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "models" && (
                        <motion.div
                            key="models"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-8"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[
                                    { id: 'contract', title: "Contrato Prestação", icon: FileSignature, color: "text-primary" },
                                    { id: 'proposal', title: "Proposta Comercial", icon: Briefcase, color: "text-muted-foreground/60" },
                                    { id: 'receipt', title: "Recibo de Pagamento", icon: Receipt, color: "text-muted-foreground/60" },
                                    { id: 'nda', title: "Termo Confidencial", icon: ShieldCheck, color: "text-muted-foreground/60" },
                                ].map((model) => (
                                    <button
                                        key={model.id}
                                        onClick={() => openGenerator(model.id)}
                                        className="bento-card p-6 flex flex-col items-center justify-center gap-4 text-center group hover:border-primary/40 transition-all hover:bg-primary/[0.01]"
                                    >
                                        <div className={cn("p-4 rounded-xl bg-muted/50 transition-transform group-hover:scale-110", model.color)}>
                                            <model.icon className="h-8 w-8" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold">{model.title}</h4>
                                            <p className="text-[10px] text-muted-foreground mt-1">Usar modelo base</p>
                                        </div>
                                    </button>
                                ))}

                                {dbTemplates.map((template: any) => (
                                    <button
                                        key={template.id}
                                        onClick={() => {
                                            setSelectedTemplate(template);
                                            setEditedContent(template.content);
                                            setIsGeneratorOpen(true);
                                        }}
                                        className="bento-card p-6 flex flex-col items-center justify-center gap-4 text-center group hover:border-primary/40 transition-all hover:bg-primary/[0.01]"
                                    >
                                        <div className="p-4 rounded-xl bg-muted/50 transition-transform group-hover:scale-110 text-primary">
                                            <FileText className="h-8 w-8" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold">{template.title}</h4>
                                            <p className="text-[10px] text-muted-foreground mt-1">Modelo Customizado</p>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="bento-card p-8 border-dashed border-primary/20 bg-primary/[0.01] text-center space-y-4">
                                <div className="max-w-md mx-auto">
                                    <Stamp className="h-10 w-10 text-primary/20 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium">Gerador de Instrumentos</h3>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Selecione um modelo acima ou crie um novo modelo customizado para sua empresa.
                                    </p>
                                    <Button
                                        className="mt-6 rounded-full px-8"
                                        onClick={() => {
                                            setSelectedTemplate({ title: "Contrato Customizado", content: "# Novo Contrato\n\nIdentificação das partes..." });
                                            setEditedContent("# Novo Contrato\n\nIdentificação das partes...");
                                            setIsGeneratorOpen(true);
                                        }}
                                    >
                                        <Plus className="h-4 w-4 mr-2" /> Criar Novo Modelo
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Generator Modal */}
            <Dialog open={isGeneratorOpen} onOpenChange={setIsGeneratorOpen}>
                <DialogContent className={cn(
                    "flex flex-col p-0 overflow-hidden bg-card border-border shadow-2xl transition-all duration-300",
                    isMaximized ? "max-w-[95vw] h-[95vh]" : "max-w-4xl h-[90vh]"
                )}>
                    <DialogHeader className="p-4 px-6 border-b border-border">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                    <FileSignature className="h-5 w-5" />
                                </div>
                                <div>
                                    <DialogTitle className="text-lg">{selectedTemplate?.title}</DialogTitle>
                                    <DialogDescription className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Editor de Documento Inteligente</DialogDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 px-1 py-1 rounded-full bg-muted/20">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsMaximized(!isMaximized)}
                                    className="rounded-full h-7 w-7 text-muted-foreground hover:text-primary hover:bg-white"
                                    title={isMaximized ? "Restaurar" : "Maximizar"}
                                >
                                    {isMaximized ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsGeneratorOpen(false)}
                                    className="rounded-full h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-white"
                                    title="Fechar"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2">
                        <div className="p-6 border-r border-border flex flex-col gap-4 bg-muted/5 overflow-y-auto custom-scrollbar">
                            <div className="flex-1 flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Conteúdo do Documento</label>
                                    <Badge variant="outline" className="text-[9px] font-mono">Markdown & Texto</Badge>
                                </div>
                                <Textarea
                                    value={editedContent}
                                    onChange={(e) => setEditedContent(e.target.value)}
                                    className="flex-1 bg-background border-border resize-none font-mono text-xs leading-relaxed custom-scrollbar min-h-[400px]"
                                    placeholder="Escreva ou edite o conteúdo aqui..."
                                />
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 flex flex-col overflow-hidden">
                            <div className="flex items-center justify-between mb-4">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Pré-visualização (Folha A4)</label>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="file"
                                        id="stationery-upload-modal"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleStationeryUpload}
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-[9px] gap-1.5 border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 text-primary"
                                        onClick={() => document.getElementById('stationery-upload-modal')?.click()}
                                        disabled={isUpdatingStationery}
                                    >
                                        {isUpdatingStationery ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                                        SUBIR PAPELARIA
                                    </Button>

                                    <div
                                        onClick={() => setUseStationery(!useStationery)}
                                        className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[9px] font-bold cursor-pointer transition-colors ${useStationery ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-white border-border text-muted-foreground'}`}
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-full ${useStationery ? 'bg-primary' : 'bg-muted-foreground'}`} />
                                        PAPELARIA
                                    </div>
                                    <Badge variant="outline" className="text-[9px] bg-white text-muted-foreground">Portrait</Badge>
                                </div>
                            </div>
                            <ScrollArea className="flex-1 border border-border/50 rounded-lg shadow-sm bg-white overflow-y-auto">
                                <div
                                    id="printable-doc"
                                    className="relative p-16 bg-white text-black min-h-[1100px] font-serif text-[13px] leading-[1.6] select-text flex flex-col"
                                    style={{
                                        backgroundImage: useStationery && companyInfo?.stationery_url ? `url(${companyInfo.stationery_url})` : 'none',
                                        backgroundSize: '100% 100%',
                                        backgroundPosition: 'center',
                                        backgroundRepeat: 'no-repeat'
                                    }}
                                >
                                    <div className="flex-1 whitespace-pre-wrap relative z-10">
                                        {editedContent}
                                    </div>
                                </div>
                            </ScrollArea>
                        </div>
                    </div>

                    <DialogFooter className="p-6 border-t border-border bg-muted/10 items-center justify-between">
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => copyToClipboard(editedContent, 'doc')} className="text-xs h-10 px-4">
                                {copied === 'doc' ? <Check className="h-3.5 w-3.5 mr-2 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 mr-2" />}
                                Copiar Texto
                            </Button>
                            <Button variant="outline" onClick={() => window.print()} className="text-xs h-10 px-4">
                                <Printer className="h-3.5 w-3.5 mr-2" />
                                Imprimir / Gerar PDF
                            </Button>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="ghost" onClick={() => setIsGeneratorOpen(false)} className="text-xs">Descartar</Button>
                            <Button
                                onClick={handleSaveTemplate}
                                className="h-10 px-8 shadow-glow-sm"
                            >
                                Salvar como Rascunho
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal para Cadastro de Faturamento Manual */}
            <Dialog open={isInvoiceModalOpen} onOpenChange={setIsInvoiceModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Registrar Emissão Manual</DialogTitle>
                        <DialogDescription>Insira os dados de faturamento do período.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground">Mês/Ano</label>
                                <Input
                                    value={invoiceForm.month_year}
                                    onChange={e => setInvoiceForm({ ...invoiceForm, month_year: e.target.value })}
                                    placeholder="MM/AAAA"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground">Qtd. Notas</label>
                                <Input
                                    type="number"
                                    value={invoiceForm.invoice_count}
                                    onChange={e => setInvoiceForm({ ...invoiceForm, invoice_count: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground">Valor Total (R$)</label>
                            <Input
                                type="number"
                                value={invoiceForm.total_amount}
                                onChange={e => setInvoiceForm({ ...invoiceForm, total_amount: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground">Impostos (R$)</label>
                            <Input
                                type="number"
                                value={invoiceForm.taxes_amount}
                                onChange={e => setInvoiceForm({ ...invoiceForm, taxes_amount: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsInvoiceModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSaveInvoice} disabled={isAddingInvoice}>
                            {isAddingInvoice ? "Salvando..." : "Salvar Registro"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal para Link NF-e */}
            <Dialog open={isLinkModalOpen} onOpenChange={setIsLinkModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Configurar Link do Portal</DialogTitle>
                        <DialogDescription>Insira o link direto para o portal de NFS-e da sua prefeitura.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground">URL do Sistema</label>
                            <div className="flex gap-2">
                                <LinkIcon className="h-4 w-4 mt-3 text-muted-foreground" />
                                <Input
                                    value={formData.nfe_url}
                                    onChange={e => setFormData({ ...formData, nfe_url: e.target.value })}
                                    placeholder="https://nfe.prefeitura.sp.gov.br"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsLinkModalOpen(false)}>Cancelar</Button>
                        <Button onClick={() => { handleSave(); setIsLinkModalOpen(false); }}>Salvar Link</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal para Upload Manual */}
            <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Enviar Novo Documento</DialogTitle>
                        <DialogDescription>Escolha um arquivo para armazenar com segurança.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground">Nome do Documento</label>
                            <Input
                                value={uploadForm.name}
                                onChange={e => setUploadForm({ ...uploadForm, name: e.target.value })}
                                placeholder="Ex: Alvará de Funcionamento"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground">Categoria</label>
                            <Input
                                value={uploadForm.category}
                                onChange={e => setUploadForm({ ...uploadForm, category: e.target.value })}
                                placeholder="Ex: Fiscal, Jurídico..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground">Arquivo</label>
                            <Input
                                type="file"
                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setIsUploadModalOpen(false);
                            setSelectedFile(null);
                        }}>Cancelar</Button>
                        <Button
                            disabled={!selectedFile || !uploadForm.name || isUploading}
                            onClick={() => {
                                if (selectedFile && uploadForm.name) {
                                    handleDocUpload(selectedFile, uploadForm.name, uploadForm.category);
                                    setIsUploadModalOpen(false);
                                    setSelectedFile(null);
                                    setUploadForm({ name: "", category: "Geral" });
                                }
                            }}
                        >
                            {isUploading ? "Enviando..." : "Enviar Documento"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Modal para Edição de Documento */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Documento</DialogTitle>
                        <DialogDescription>Atualize o nome ou a categoria do documento.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground">Nome do Documento</label>
                            <Input
                                value={editingDocument?.name || ""}
                                onChange={e => setEditingDocument({ ...editingDocument, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground">Categoria</label>
                            <Input
                                value={editingDocument?.category || ""}
                                onChange={e => setEditingDocument({ ...editingDocument, category: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleUpdateDoc}>Salvar Alterações</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Empresa;

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Globe, Layout, SearchCheck, FileText, Zap, ArrowRight, Loader2, CheckCircle2, AlertCircle, BarChart3, TrendingUp, ShieldCheck, Briefcase, ExternalLink, Download, Star, Quote, User, Share2, Mail, MessageCircle, Facebook, Send, Info, Clock, Check, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, Cell, RadialBarChart, RadialBar } from 'recharts';
import { analyzeWebsite, getWebsiteSuggestions, generateReportSection } from './services/geminiService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ChartData {
  kpis: { 
    name: string; 
    current: number; 
    target: number;
    explanation?: string;
    calculation?: string;
  }[];
  trends: { 
    month: string; 
    traffic: number; 
    conversions: number;
    impressions?: number;
  }[];
  revenueLeak: { 
    annualLoss: number; 
    reason: string;
    calculation?: string;
  };
  competitors: { name: string; url: string; score: number; gap: string }[];
  roiSimulation: { baseline: number; projected: number; factors: string[] };
  roadmap: { phase: string; tasks: string[]; impact: string }[];
  trendInsights: string;
  marketAuthority: number;
  detailedAnalysis?: string;
  deepDive?: {
    title: string;
    content: string;
    metrics: { label: string; value: string }[];
  };
}

export default function App() {
  const [url, setUrl] = useState('');
  const [analyzedUrl, setAnalyzedUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<{ title: string; url: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [roiMultiplier, setRoiMultiplier] = useState(1);
  const [isWhiteLabel, setIsWhiteLabel] = useState(false);
  const [agencyName, setAgencyName] = useState('Apex Digital Strategy');
  const [activeTab, setActiveTab] = useState<'audit' | 'methodology' | 'cases' | 'about' | 'contact'>('audit');
  const [showDetailedReport, setShowDetailedReport] = useState(false);
  const [fullReportSections, setFullReportSections] = useState<{title: string, content: string}[]>([]);
  const [isGeneratingFullReport, setIsGeneratingFullReport] = useState(false);
  const [currentGeneratingSection, setCurrentGeneratingSection] = useState<string | null>(null);
  const [analysisStep, setAnalysisStep] = useState(0);
  const reportRef = useRef<HTMLDivElement>(null);

  const analysisSteps = [
    "Connecting to digital ecosystem...",
    "Crawling semantic architecture...",
    "Analyzing market authority signals...",
    "Evaluating conversion path psychology...",
    "Calculating revenue leakage metrics...",
    "Simulating ROI growth trajectories...",
    "Finalizing strategic growth dossier..."
  ];

  // Scroll to top on tab change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  // Debounced suggestions
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (url && url.length > 2 && !url.startsWith('http') && !url.includes('.')) {
        const results = await getWebsiteSuggestions(url);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [url]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAnalyzing) {
      setAnalysisStep(0);
      interval = setInterval(() => {
        setAnalysisStep((prev) => (prev + 1) % analysisSteps.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const { markdownContent, chartData } = useMemo(() => {
    if (!analysis) return { markdownContent: null, chartData: null };

    let data: ChartData | null = null;
    let content = analysis;

    // Try parsing as pure JSON first (new behavior)
    try {
      const parsed = JSON.parse(analysis);
      if (parsed && typeof parsed === 'object' && parsed.kpis) {
        data = parsed as ChartData;
        content = parsed.detailedAnalysis || '';
        return { markdownContent: content, chartData: data };
      }
    } catch (e) {
      // Not pure JSON, fall back to regex matching (old behavior)
      const jsonMatch = analysis.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        try {
          data = JSON.parse(jsonMatch[1]);
          content = analysis.replace(jsonMatch[0], '').trim();
          // Remove common AI headers that might leak into the markdown
          content = content.replace(/###?\s*\d+\.?\s*JSON DATA BLOCK/gi, '');
          content = content.replace(/###?\s*JSON STRUCTURE/gi, '');
        } catch (e2) {
          console.error("Failed to parse KPI data from markdown block", e2);
        }
      }
    }

    return { markdownContent: content, chartData: data };
  }, [analysis]);

  const handleGenerateFullReport = async () => {
    if (!analyzedUrl || !analysis) return;
    setIsGeneratingFullReport(true);
    setFullReportSections([]);
    setShowDetailedReport(true);

    const sections = [
      "Executive Summary & Business Intelligence",
      "Market Position & Competitive Landscape Analysis",
      "Technical Architecture & Core Web Vitals Audit",
      "UX/UI Psychology & Conversion Path Optimization",
      "Content Strategy & Semantic SEO Dominance",
      "Mobile Experience & Responsive Performance",
      "Security, Privacy & Trust Signals Audit",
      "Social Proof & Authority Building Strategy",
      "Revenue Leakage & ROI Recovery Roadmap",
      "90-Day Tactical Execution Plan"
    ];

    try {
      setCurrentGeneratingSection("Strategic Intelligence Gathering...");
      
      // Parallelize generation for better performance
      const generationPromises = sections.map(async (sectionTitle) => {
        const content = await generateReportSection(analyzedUrl, sectionTitle, analysis.substring(0, 1000));
        return { title: sectionTitle, content };
      });

      const completedSections: { title: string; content: string }[] = [];
      
      // Update UI as each section completes
      await Promise.all(generationPromises.map(p => p.then(section => {
        completedSections.push(section);
        // Sort to maintain original order
        const sorted = [...completedSections].sort((a, b) => 
          sections.indexOf(a.title) - sections.indexOf(b.title)
        );
        setFullReportSections(sorted);
        setCurrentGeneratingSection(`Completed: ${section.title}`);
      })));

    } catch (err) {
      console.error("Full report generation failed", err);
      setError("Failed to generate the full strategic dossier. Please try again.");
    } finally {
      setIsGeneratingFullReport(false);
      setCurrentGeneratingSection(null);
    }
  };

  const growthScore = useMemo(() => {
    if (!chartData || !chartData.kpis.length) return null;
    const avg = chartData.kpis.reduce((acc, kpi) => acc + kpi.current, 0) / chartData.kpis.length;
    return Math.round(avg);
  }, [chartData]);

  const handleAnalyze = async (e: React.FormEvent | string) => {
    if (typeof e !== 'string') e.preventDefault();
    const targetUrl = typeof e === 'string' ? e : url;
    
    if (!targetUrl) return;

    // Normalize URL
    let normalizedUrl = targetUrl.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      if (normalizedUrl.includes('.')) {
        normalizedUrl = `https://${normalizedUrl}`;
      } else {
        // If it's just a word, try to find the best match or just use it as is (Gemini will handle)
        // For now, we'll just assume it's a domain if it has no dots but we'll let the suggestions handle the "search" part
      }
    }

    setIsAnalyzing(true);
    setAnalysis(null);
    setError(null);
    setShowSuggestions(false);

    try {
      const result = await analyzeWebsite(normalizedUrl);
      setAnalysis(result);
      setAnalyzedUrl(normalizedUrl);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to analyze the website. Please check the URL and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleShare = (platform: 'twitter' | 'linkedin' | 'whatsapp' | 'facebook' | 'reddit' | 'telegram' | 'email' | 'copy' | 'pdf') => {
    const shareUrl = window.location.href;
    const text = `Check out this strategic audit for ${analyzedUrl}!`;

    const platforms = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      reddit: `https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(text)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`,
      email: `mailto:?subject=${encodeURIComponent('Strategic Website Audit')}&body=${encodeURIComponent(text + '\n\n' + shareUrl)}`
    };

    if (platform === 'copy') {
      navigator.clipboard.writeText(shareUrl);
      setToast({ message: 'Link copied to clipboard!', type: 'success' });
    } else if (platform === 'pdf') {
      handleExport('pdf');
    } else if (platforms[platform as keyof typeof platforms]) {
      window.open(platforms[platform as keyof typeof platforms], '_blank');
    }
  };

  const handleWebShare = async () => {
    if (!reportRef.current || !chartData) return;
    setIsExporting(true);

    try {
      const filename = `Strategic-Audit-${analyzedUrl?.replace(/[^a-z0-9]/gi, '-')}.pdf`;
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: reportRef.current.scrollWidth,
        windowHeight: reportRef.current.scrollHeight
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      
      const pdfBlob = pdf.output('blob');
      const file = new File([pdfBlob], filename, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Strategic Website Audit',
          text: `Strategic audit for ${analyzedUrl}`,
        });
      } else if (navigator.share) {
        // Fallback to link share if file share not supported but share is
        await navigator.share({
          title: 'Strategic Website Audit',
          text: `Check out this strategic audit for ${analyzedUrl}!`,
          url: window.location.href,
        });
      } else {
        // Desktop fallback: Download and copy link
        pdf.save(filename);
        navigator.clipboard.writeText(window.location.href);
        setToast({ message: 'PDF downloaded & link copied!', type: 'success' });
      }
    } catch (err) {
      console.error('Error sharing:', err);
      setToast({ message: 'Sharing failed. Please try downloading instead.', type: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'csv' | 'json') => {
    if (!reportRef.current || !chartData) return;
    setIsExporting(true);
    
    try {
      const filename = `Strategic-Audit-${analyzedUrl?.replace(/[^a-z0-9]/gi, '-')}`;

      if (format === 'pdf') {
        const canvas = await html2canvas(reportRef.current, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: reportRef.current.scrollWidth,
          windowHeight: reportRef.current.scrollHeight
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const imgProps = pdf.getImageProperties(imgData);
        const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
          heightLeft -= pdfHeight;
        }
        
        pdf.save(`${filename}.pdf`);
      } else if (format === 'json') {
        const blob = new Blob([JSON.stringify(chartData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.json`;
        a.click();
      } else if (format === 'csv') {
        const kpiRows = chartData.kpis.map(k => `KPI,${k.name},${k.current},${k.target}`).join('\n');
        const trendRows = chartData.trends.map(t => `Trend,${t.month},${t.traffic},${t.conversions}`).join('\n');
        const csvContent = `Type,Name/Month,Value/Traffic,Target/Conversions\n${kpiRows}\n${trendRows}`;
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.csv`;
        a.click();
      }
    } catch (err) {
      console.error(`${format.toUpperCase()} Export failed`, err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] font-sans selection:bg-blue-100 antialiased">
      {/* Navigation */}
      <nav className="sticky top-0 z-[100] bg-white border-b border-[#dadce0] px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('audit')}>
              <div className="flex gap-0.5">
                <div className="w-2 h-6 bg-[#4285f4] rounded-full" />
                <div className="w-2 h-6 bg-[#ea4335] rounded-full" />
                <div className="w-2 h-6 bg-[#fbbc05] rounded-full" />
                <div className="w-2 h-6 bg-[#34a853] rounded-full" />
              </div>
              <span className="text-xl font-medium text-[#5f6368] tracking-tight">Website Analyzer</span>
            </div>
            
            <div className="hidden md:flex items-center gap-1">
              {[
                { id: 'audit', label: 'Audit', icon: Search },
                { id: 'methodology', label: 'Methodology', icon: Zap },
                { id: 'cases', label: 'Case Studies', icon: Briefcase },
                { id: 'about', label: 'About Us', icon: ShieldCheck },
                { id: 'contact', label: 'Contact', icon: Globe },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id 
                      ? 'bg-[#e8f0fe] text-[#1a73e8]' 
                      : 'text-[#5f6368] hover:bg-[#f1f3f4]'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <button
                onClick={() => setIsWhiteLabel(!isWhiteLabel)}
                className={`px-4 py-2 rounded-md text-sm font-medium border transition-all flex items-center gap-2 ${
                  isWhiteLabel 
                    ? 'bg-[#1a73e8] text-white border-transparent' 
                    : 'bg-white text-[#5f6368] border-[#dadce0] hover:bg-[#f8f9fa]'
                }`}
              >
                {isWhiteLabel ? 'Branding Active' : 'Enable White Label'}
                <Info size={14} className="opacity-60" />
              </button>
              <div className="absolute top-full right-0 mt-2 w-64 p-4 bg-white border border-[#dadce0] rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 text-xs text-[#5f6368] leading-relaxed">
                <p className="font-bold text-[#202124] mb-1">White Label Mode</p>
                <p>Enable this to replace our branding with your own agency name. Perfect for consultants presenting reports directly to clients.</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {isWhiteLabel && (
        <div className="bg-blue-50 border-b border-blue-100 px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Agency Branding:</span>
              <input 
                type="text" 
                value={agencyName} 
                onChange={(e) => setAgencyName(e.target.value)}
                className="bg-white border border-blue-200 rounded-lg px-3 py-1 text-sm font-medium text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <p className="text-xs text-blue-400 font-medium italic">Changes will reflect in the PDF export and UI header.</p>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-20">
        <AnimatePresence mode="wait">
          {activeTab === 'audit' && (
            <motion.div
              key="audit"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Hero Section - Only show if no analysis or error */}
              {!analysis && !isAnalyzing && !error && (
                <div className="text-center mb-20 pt-10">
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-5xl md:text-7xl font-medium tracking-tight mb-6 text-[#202124]"
                  >
                    Analyze your website.
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-xl text-[#5f6368] max-w-2xl mx-auto mb-12"
                  >
                    Get a professional strategic growth audit powered by AI.
                    Understand your market authority and revenue potential.
                  </motion.p>

                  <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    onSubmit={handleAnalyze}
                    className="relative max-w-2xl mx-auto"
                  >
                    <div className="relative flex items-center p-1.5 bg-white border border-[#dadce0] rounded-full shadow-sm hover:shadow-md transition-shadow">
                      <div className="pl-5 text-[#9aa0a6]">
                        <Search size={20} />
                      </div>
                      <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                        placeholder="Enter a website URL"
                        required
                        className="w-full bg-transparent border-none focus:ring-0 outline-none text-lg py-3 px-4 text-[#202124]"
                      />
                      <button
                        type="submit"
                        disabled={isAnalyzing}
                        className="google-button-primary rounded-full px-8 py-3"
                      >
                        {isAnalyzing ? (
                          <Loader2 className="animate-spin" size={20} />
                        ) : (
                          'Analyze'
                        )}
                      </button>
                    </div>

                    {/* Suggestions Dropdown */}
                    <AnimatePresence>
                      {showSuggestions && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-3xl shadow-2xl overflow-hidden z-50"
                        >
                          <div className="p-4 border-b border-gray-50 bg-gray-50/50 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            Suggested Websites
                          </div>
                          <div className="max-h-[300px] overflow-y-auto">
                            {suggestions.map((s, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => {
                                  setUrl(s.url);
                                  handleAnalyze(s.url);
                                }}
                                className="w-full px-6 py-4 text-left hover:bg-gray-50 flex items-center justify-between group transition-colors"
                              >
                                <div>
                                  <div className="font-bold text-[#1d1d1f] group-hover:text-blue-600 transition-colors">{s.title}</div>
                                  <div className="text-xs text-gray-400 font-medium">{s.url}</div>
                                </div>
                                <ExternalLink size={14} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.form>
                </div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-8 rounded-3xl bg-red-50 border border-red-100 text-red-600 flex items-start gap-4 mb-12 shadow-sm"
                >
                  <AlertCircle className="shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold mb-1 uppercase tracking-wider text-sm">Strategic Failure</h3>
                    <p className="text-sm font-medium opacity-90">{error}</p>
                  </div>
                </motion.div>
              )}

              {isAnalyzing && (
                <div className="space-y-10">
                  <div className="google-card p-12 flex flex-col items-center justify-center text-center space-y-8 min-h-[400px]">
                    <div className="relative">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="text-[#1a73e8]"
                      >
                        <Clock size={64} strokeWidth={1.5} />
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 flex items-center justify-center text-[#1a73e8]"
                      >
                        <Zap size={24} fill="currentColor" />
                      </motion.div>
                    </div>
                    
                    <div className="space-y-4 max-w-md">
                      <h3 className="text-2xl font-medium text-[#202124]">Analyzing Digital Footprint</h3>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 20, ease: "linear" }}
                          className="h-full bg-[#1a73e8]"
                        />
                      </div>
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={analysisStep}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="text-[#5f6368] font-medium italic"
                        >
                          {analysisSteps[analysisStep]}
                        </motion.p>
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 opacity-40 grayscale pointer-events-none">
                    <div className="lg:col-span-2 space-y-10">
                      <div className="h-[700px] rounded-[3rem] bg-white border border-black/5 shadow-sm" />
                    </div>
                    <div className="space-y-10">
                      <div className="h-[350px] rounded-[3rem] bg-white border border-black/5 shadow-sm" />
                      <div className="h-[350px] rounded-[3rem] bg-white border border-black/5 shadow-sm" />
                    </div>
                  </div>
                </div>
              )}

              {analysis && chartData && (
                <motion.div
                  ref={reportRef}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-10"
                >
                  {/* Header Section */}
                  <div className="google-card overflow-hidden mb-8">
                    <div className="p-8 border-b border-[#dadce0] flex flex-col lg:flex-row items-center justify-between gap-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#e8f0fe] text-[#1a73e8] flex items-center justify-center">
                          <Briefcase size={24} />
                        </div>
                        <div>
                          <h2 className="text-2xl font-medium text-[#202124]">Strategic Audit Report</h2>
                          <p className="text-sm text-[#5f6368]">
                            Prepared by <span className="text-[#1a73e8] font-medium">{agencyName}</span> for {analyzedUrl}
                          </p>
                        </div>
                      </div>

                      {/* Compact Search Bar in Report */}
                      <form onSubmit={handleAnalyze} className="relative flex-1 max-w-md w-full">
                        <div className="relative flex items-center p-1 bg-white border border-[#dadce0] rounded-full">
                          <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="New audit..."
                            className="w-full bg-transparent border-none focus:ring-0 outline-none text-sm py-2 px-4 text-[#202124]"
                          />
                          <button
                            type="submit"
                            disabled={isAnalyzing}
                            className="p-2 rounded-full bg-[#1a73e8] text-white hover:bg-[#1765cc] transition-colors disabled:opacity-50"
                          >
                            {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                          </button>
                        </div>
                      </form>

                      <div className="flex items-center gap-3">
                        <div className="relative group/export">
                          <button className="google-button-outline flex items-center gap-2">
                            <Download size={16} />
                            Export
                          </button>
                          <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-[#dadce0] rounded-md shadow-lg opacity-0 invisible group-hover/export:opacity-100 group-hover/export:visible transition-all z-50 py-1">
                            <button onClick={() => handleExport('pdf')} className="w-full px-4 py-2 text-left text-sm text-[#3c4043] hover:bg-[#f8f9fa] flex items-center gap-2">
                              <FileText size={14} /> PDF Report
                            </button>
                            <button onClick={() => handleExport('csv')} className="w-full px-4 py-2 text-left text-sm text-[#3c4043] hover:bg-[#f8f9fa] flex items-center gap-2">
                              <BarChart3 size={14} /> CSV Data
                            </button>
                            <button onClick={() => handleExport('json')} className="w-full px-4 py-2 text-left text-sm text-[#3c4043] hover:bg-[#f8f9fa] flex items-center gap-2">
                              <Zap size={14} /> JSON Raw
                            </button>
                          </div>
                        </div>

                        <div className="relative group/share">
                          <button 
                            onClick={handleWebShare}
                            className="google-button-primary flex items-center gap-2"
                            disabled={isExporting}
                          >
                            {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
                            {isExporting ? 'Generating PDF...' : 'Share Report (PDF)'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bento Grid Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    
                    {/* Score & Market Authority (Top Row) */}
                    <div className="lg:col-span-8 bg-gradient-to-br from-white to-blue-50/30 border border-blue-100 rounded-[3rem] p-12 text-[#202124] shadow-xl shadow-blue-500/5 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full -mr-20 -mt-20 group-hover:bg-blue-500/15 transition-all duration-700" />
                      <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                        <div className="relative w-56 h-56 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90">
                            <defs>
                              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#1a73e8" />
                                <stop offset="100%" stopColor="#4285f4" />
                              </linearGradient>
                            </defs>
                            <circle cx="112" cy="112" r="100" stroke="#f1f3f4" strokeWidth="16" fill="transparent" />
                            <circle 
                              cx="112" cy="112" r="100" 
                              stroke="url(#scoreGradient)" 
                              strokeWidth="16" 
                              fill="transparent" 
                              strokeDasharray={628} 
                              strokeDashoffset={628 - (628 * (growthScore || 0)) / 100} 
                              className="transition-all duration-1000 ease-out" 
                              strokeLinecap="round" 
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-7xl font-bold tracking-tighter text-[#1a73e8]">{growthScore}%</span>
                            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#5f6368] mt-1">Growth Index</span>
                          </div>
                        </div>
                        <div className="flex-1 space-y-6 text-center md:text-left">
                          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-blue-100 shadow-sm">
                            <ShieldCheck size={16} className="text-[#1a73e8]" />
                            <span className="text-[11px] font-bold uppercase tracking-widest text-[#1a73e8]">Market Readiness Index</span>
                          </div>
                          <h2 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight text-[#1d1d1f]">
                            Strategic Growth <br /> Potential
                          </h2>
                          <p className="text-[#5f6368] text-xl font-medium max-w-md leading-relaxed">
                            Your digital ecosystem shows <span className="text-[#1a73e8] font-extrabold">{growthScore! > 70 ? 'exceptional' : 'significant'}</span> headroom for expansion and market capture.
                          </p>
                          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                            <button 
                              onClick={handleGenerateFullReport}
                              disabled={isGeneratingFullReport}
                              className="google-button-primary flex items-center gap-3 px-8 py-4 text-base"
                            >
                              {isGeneratingFullReport ? (
                                <>
                                  <Loader2 size={20} className="animate-spin" />
                                  Generating Dossier...
                                </>
                              ) : (
                                <>
                                  Full Strategic Report <ArrowRight size={20} />
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-4 grid grid-rows-2 gap-10">
                      <div className="bg-white border border-black/5 rounded-[3rem] p-10 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-full h-32 relative">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="100%" barSize={10} data={[{ name: 'Authority', value: chartData.marketAuthority, fill: '#0071e3' }]} startAngle={180} endAngle={0}>
                              <RadialBar background dataKey="value" cornerRadius={10} />
                            </RadialBarChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
                            <span className="text-3xl font-bold text-[#1d1d1f]">{chartData.marketAuthority}%</span>
                            <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400">Market Authority</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-black/5 rounded-[3rem] p-10 shadow-sm flex flex-col justify-center space-y-2">
                        <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                          <Zap size={20} />
                        </div>
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Annual Revenue Leakage</h3>
                        <p className="text-3xl font-bold text-red-600 tracking-tight">-${chartData.revenueLeak.annualLoss.toLocaleString()}</p>
                        <p className="text-[10px] text-gray-500 font-medium leading-relaxed line-clamp-2">{chartData.revenueLeak.reason}</p>
                      </div>
                    </div>

                    {/* Main Content & ROI Simulator (Middle Row) */}
                    <div className="lg:col-span-8 space-y-10">
                      <div className="bg-white border border-black/5 rounded-[3rem] p-12 shadow-sm">
                        <div className="markdown-body prose prose-slate max-w-none prose-headings:tracking-tight prose-headings:font-bold prose-headings:text-[#1d1d1f] prose-p:text-gray-600 prose-p:text-lg prose-p:leading-relaxed prose-li:text-gray-600 prose-li:text-lg">
                          <Markdown>{markdownContent}</Markdown>
                        </div>
                      </div>

                      {/* Strategic Deep Dive */}
                      {chartData.deepDive && (
                        <div className="bg-white border border-black/5 rounded-[3rem] p-12 shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full -mr-32 -mt-32" />
                          <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-8">
                              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Zap size={24} />
                              </div>
                              <h3 className="text-2xl font-bold tracking-tight text-[#1d1d1f]">{chartData.deepDive.title}</h3>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                              <div className="lg:col-span-2">
                                <p className="text-gray-600 text-lg leading-relaxed font-medium">
                                  {chartData.deepDive.content}
                                </p>
                              </div>
                              <div className="space-y-6">
                                {chartData.deepDive.metrics.map((m, i) => (
                                  <div key={i} className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{m.label}</p>
                                    <p className="text-2xl font-bold text-blue-600 tracking-tight">{m.value}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Trends Chart */}
                      <div className="bg-white border border-black/5 rounded-[3rem] p-12 shadow-sm">
                        <div className="flex items-center justify-between mb-10">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                              <TrendingUp size={24} />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-[#1d1d1f]">Performance Trends</h3>
                              <p className="text-sm text-gray-500 font-medium">6-Month historical & projected trajectory</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-[#1a73e8]" />
                              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Traffic</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-[#34a853]" />
                              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Conversions</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-[#fbbc05]" />
                              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Impressions</span>
                            </div>
                          </div>
                        </div>
                        <div className="h-[400px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData.trends}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f4" />
                              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#86868b', fontSize: 12 }} dy={10} />
                              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#86868b', fontSize: 12 }} />
                              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#86868b', fontSize: 12 }} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                              />
                              <Line yAxisId="left" type="monotone" dataKey="traffic" stroke="#1a73e8" strokeWidth={4} dot={{ r: 6, fill: '#1a73e8', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                              <Line yAxisId="left" type="monotone" dataKey="conversions" stroke="#34a853" strokeWidth={4} dot={{ r: 6, fill: '#34a853', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                              <Line yAxisId="right" type="monotone" dataKey="impressions" stroke="#fbbc05" strokeWidth={4} dot={{ r: 6, fill: '#fbbc05', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="mt-8 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                          <p className="text-sm text-gray-600 leading-relaxed italic">
                            <span className="font-bold text-[#1d1d1f] not-italic">Strategic Insight:</span> {chartData.trendInsights}
                          </p>
                        </div>
                      </div>

                      {/* ROI Simulator */}
                      <div className="bg-gradient-to-br from-white to-blue-50/20 border border-blue-100 rounded-[3rem] p-12 text-[#202124] shadow-xl shadow-blue-500/5 relative overflow-hidden">
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full -ml-32 -mb-32" />
                        <div className="relative z-10">
                          <div className="flex flex-col md:flex-row items-center justify-between gap-10 mb-12">
                            <div className="space-y-4">
                              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                                <Zap size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Interactive ROI Simulator</span>
                              </div>
                              <h3 className="text-4xl font-bold tracking-tight text-[#1d1d1f]">Projected Growth Impact</h3>
                              <p className="text-gray-500 text-lg font-medium max-w-md">Adjust the optimization intensity to see how strategic improvements impact your bottom line.</p>
                            </div>
                            <div className="bg-white p-8 rounded-[2.5rem] border border-blue-100 text-center min-w-[280px] shadow-lg shadow-blue-500/5">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Projected Annual Revenue Lift</p>
                              <p className="text-5xl font-bold text-[#1a73e8] tracking-tighter">
                                +${Math.round((chartData.roiSimulation.projected - chartData.roiSimulation.baseline) * roiMultiplier).toLocaleString()}
                              </p>
                              <div className="mt-4 flex items-center justify-center gap-2 text-green-600 font-bold text-sm">
                                <TrendingUp size={16} />
                                <span>{Math.round(((chartData.roiSimulation.projected * roiMultiplier) / chartData.roiSimulation.baseline - 1) * 100)}% Growth</span>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-10">
                            <div className="space-y-6">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-bold uppercase tracking-widest text-gray-500">Optimization Intensity</span>
                                <div className="px-4 py-1.5 rounded-full bg-blue-600 text-white text-sm font-bold">
                                  {Math.round(roiMultiplier * 100)}%
                                </div>
                              </div>
                              <div className="relative h-4 flex items-center">
                                <div className="absolute inset-0 bg-gray-100 rounded-full" />
                                <div 
                                  className="absolute inset-y-0 left-0 bg-blue-600 rounded-full"
                                  style={{ width: `${((roiMultiplier - 0.5) / 1.5) * 100}%` }}
                                />
                                <input 
                                  type="range" 
                                  min="0.5" 
                                  max="2" 
                                  step="0.1" 
                                  value={roiMultiplier} 
                                  onChange={(e) => setRoiMultiplier(parseFloat(e.target.value))}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div 
                                  className="absolute w-8 h-8 bg-white border-4 border-blue-600 rounded-full shadow-lg pointer-events-none"
                                  style={{ left: `calc(${((roiMultiplier - 0.5) / 1.5) * 100}% - 16px)` }}
                                />
                              </div>
                              <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                <span>Conservative</span>
                                <span>Aggressive Dominance</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {chartData.roiSimulation.factors.map((factor, i) => (
                                <div key={i} className="flex items-center gap-3 bg-white/60 backdrop-blur-sm px-6 py-4 rounded-2xl border border-blue-50 shadow-sm hover:border-blue-200 transition-colors">
                                  <div className="w-6 h-6 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                                    <Check size={14} />
                                  </div>
                                  <span className="text-sm font-bold text-gray-700">{factor}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sidebar Visuals (Charts & Roadmap) */}
                    <div className="lg:col-span-4 space-y-10">
                      {/* KPI Benchmarks */}
                      <div className="bg-white border border-black/5 rounded-[3rem] p-10 shadow-sm">
                        <div className="flex items-center gap-4 mb-10">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <BarChart3 size={20} />
                          </div>
                          <h3 className="text-sm font-bold uppercase tracking-widest text-[#1d1d1f]">KPI Benchmarks</h3>
                        </div>
                        <div className="space-y-8">
                          {chartData.kpis.map((kpi, i) => (
                            <div key={i} className="space-y-3 group">
                              <div className="flex justify-between items-end">
                                <div className="max-w-[70%]">
                                  <h4 className="font-bold text-[#1d1d1f] text-sm">{kpi.name}</h4>
                                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-tight">{kpi.explanation}</p>
                                </div>
                                <div className="text-right">
                                  <span className="text-lg font-bold text-[#1a73e8]">{kpi.current}</span>
                                  <span className="text-[10px] text-gray-400 font-bold"> / {kpi.target}</span>
                                </div>
                              </div>
                              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  whileInView={{ width: `${Math.min(100, (kpi.current / kpi.target) * 100)}%` }}
                                  className="h-full bg-[#1a73e8] rounded-full"
                                  transition={{ duration: 1, delay: i * 0.1 }}
                                />
                              </div>
                              {kpi.calculation && (
                                <p className="text-[9px] text-gray-400 italic leading-tight opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span className="font-bold not-italic">Methodology:</span> {kpi.calculation}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Competitor Battle Card */}
                      <div className="bg-white border border-black/5 rounded-[3rem] p-10 shadow-sm">
                        <div className="flex items-center gap-4 mb-8">
                          <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-600 flex items-center justify-center">
                            <Globe size={20} />
                          </div>
                          <h3 className="text-sm font-bold uppercase tracking-widest text-[#1d1d1f]">Competitor Battle Card</h3>
                        </div>
                        <div className="space-y-6">
                          {chartData.competitors.map((comp, i) => (
                            <div key={i} className="p-5 rounded-2xl bg-gray-50 border border-gray-100 group hover:bg-white hover:shadow-lg hover:shadow-black/5 transition-all">
                              <div className="flex justify-between items-center mb-2">
                                <div className="flex flex-col">
                                  <span className="font-bold text-[#1d1d1f]">{comp.name}</span>
                                  {comp.url && (
                                    <a 
                                      href={comp.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="text-[10px] text-blue-600 hover:underline flex items-center gap-1"
                                    >
                                      {new URL(comp.url).hostname} <ExternalLink size={8} />
                                    </a>
                                  )}
                                </div>
                                <span className={`text-xs font-bold px-2 py-1 rounded-md ${comp.score > growthScore! ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                  {comp.score}%
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2">Strategic Gap</p>
                              <p className="text-sm text-gray-600 font-medium">{comp.gap}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 90-Day Roadmap */}
                      <div className="bg-white border border-black/5 rounded-[3rem] p-10 shadow-sm">
                        <div className="flex items-center gap-4 mb-8">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <TrendingUp size={20} />
                          </div>
                          <h3 className="text-sm font-bold uppercase tracking-widest text-[#1d1d1f]">90-Day Roadmap</h3>
                        </div>
                        <div className="space-y-8 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-gray-100">
                          {chartData.roadmap.map((step, i) => (
                            <div key={i} className="relative pl-12">
                              <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center z-10">
                                <span className="text-xs font-bold text-blue-600">{i + 1}</span>
                              </div>
                              <h4 className="font-bold text-sm text-[#1d1d1f] mb-1">{step.phase}</h4>
                              <p className="text-xs text-blue-600 font-bold uppercase tracking-widest mb-3">{step.impact}</p>
                              <ul className="space-y-1">
                                {step.tasks.map((task, j) => (
                                  <li key={j} className="text-xs text-gray-500 font-medium flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-gray-300" />
                                    {task}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {!analysis && !isAnalyzing && !error && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8"
                  >
                    {[
                      { icon: <Layout className="text-blue-600" />, title: "Visual DNA", desc: "We analyze aesthetic resonance and conversion architecture." },
                      { icon: <SearchCheck className="text-blue-600" />, title: "Authority Audit", desc: "Deep-dive into SEO moats and keyword dominance." },
                      { icon: <Zap className="text-blue-600" />, title: "Velocity Check", desc: "Technical performance impact on user retention." }
                    ].map((item, i) => (
                      <div key={i} className="bg-white p-10 rounded-[2.5rem] border border-black/5 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all group">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                          {item.icon}
                        </div>
                        <h3 className="text-xl font-bold mb-4 text-[#1d1d1f] tracking-tight">{item.title}</h3>
                        <p className="text-gray-500 leading-relaxed font-medium">{item.desc}</p>
                      </div>
                    ))}
                  </motion.div>

                  {/* Customer Reviews Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-40 mb-20"
                  >
                    <div className="text-center mb-16">
                      <h2 className="text-4xl font-bold tracking-tight text-[#1d1d1f] mb-4">Trusted by Industry Leaders</h2>
                      <p className="text-xl text-gray-500 font-medium">See why top executives rely on Apex Digital Strategy.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {[
                        {
                          name: "Sarah Chen",
                          role: "CMO, TechFlow Systems",
                          text: "The Strategic Growth Audit was a game-changer. We identified a 22% conversion leak in our checkout process within minutes.",
                          rating: 5
                        },
                        {
                          name: "Marcus Thorne",
                          role: "Founder, E-com Dominance",
                          text: "Finally, an audit tool that speaks the language of business, not just code. The KPI benchmarks are incredibly accurate.",
                          rating: 5
                        },
                        {
                          name: "Elena Rodriguez",
                          role: "Product Lead, SaaSify",
                          text: "The depth of analysis is staggering. It's like having a senior consultant on demand. The PDF reports are board-room ready.",
                          rating: 5
                        }
                      ].map((review, i) => (
                        <div key={i} className="bg-white p-10 rounded-[3rem] border border-black/5 shadow-sm relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                            <Quote size={80} />
                          </div>
                          <div className="flex gap-1 mb-6">
                            {[...Array(review.rating)].map((_, i) => (
                              <Star key={i} size={16} className="fill-blue-600 text-blue-600" />
                            ))}
                          </div>
                          <p className="text-lg text-gray-600 font-medium leading-relaxed mb-8 italic">"{review.text}"</p>
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                              <User size={24} />
                            </div>
                            <div>
                              <p className="font-bold text-[#1d1d1f]">{review.name}</p>
                              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{review.role}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </motion.div>
          )}

          {activeTab === 'methodology' && (
            <motion.div
              key="methodology"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="text-center mb-20">
                <h2 className="text-5xl font-bold tracking-tight text-[#1d1d1f] mb-6">Our Methodology</h2>
                <p className="text-xl text-gray-500 font-medium leading-relaxed">
                  We employ a multi-vector strategic audit that combines high-level business intelligence with deep technical scrutiny.
                </p>
              </div>

              <div className="space-y-12">
                {[
                  {
                    title: "Technical Scrutiny",
                    desc: "We analyze the underlying architecture, from server response times to DOM complexity, ensuring your foundation can support rapid growth.",
                    icon: <Zap className="text-blue-600" />
                  },
                  {
                    title: "Semantic Authority",
                    desc: "Our AI models evaluate your content's topical depth and relevance against market leaders to identify authority gaps.",
                    icon: <SearchCheck className="text-blue-600" />
                  },
                  {
                    title: "UX Psychology",
                    desc: "We audit the user journey through the lens of behavioral economics, identifying friction points that hinder conversion.",
                    icon: <Layout className="text-blue-600" />
                  },
                  {
                    title: "Market Positioning",
                    desc: "By benchmarking against competitors, we define your unique value proposition and identify untapped market segments.",
                    icon: <TrendingUp className="text-blue-600" />
                  }
                ].map((item, i) => (
                  <div key={i} className="bg-white p-10 rounded-[3rem] border border-black/5 shadow-sm flex gap-8 items-start">
                    <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-[#1d1d1f] mb-3">{item.title}</h3>
                      <p className="text-gray-500 text-lg leading-relaxed font-medium">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'cases' && (
            <motion.div
              key="cases"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="text-center mb-20">
                <h2 className="text-5xl font-bold tracking-tight text-[#1d1d1f] mb-6">Case Studies</h2>
                <p className="text-xl text-gray-500 font-medium">Real results for industry-leading enterprises.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {[
                  {
                    client: "Lumina SaaS",
                    impact: "+42% MRR",
                    desc: "Identified critical onboarding friction points and optimized the feature-to-value loop.",
                    tags: ["SaaS", "UX Audit", "Conversion"]
                  },
                  {
                    client: "Velvet E-com",
                    impact: "2.4x ROAS",
                    desc: "Restructured semantic architecture and product category hierarchy for organic dominance.",
                    tags: ["E-commerce", "SEO", "Architecture"]
                  },
                  {
                    client: "Titan Logistics",
                    impact: "-30% Churn",
                    desc: "Streamlined the enterprise dashboard interface and improved technical performance by 60%.",
                    tags: ["Enterprise", "Performance", "Retention"]
                  }
                ].map((item, i) => (
                  <div key={i} className="bg-white rounded-[3rem] border border-black/5 overflow-hidden shadow-sm group hover:shadow-2xl hover:shadow-black/5 transition-all">
                    <div className="h-48 bg-gray-100 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700 opacity-10 group-hover:opacity-20 transition-opacity" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl font-bold text-blue-600/20">{item.client}</span>
                      </div>
                    </div>
                    <div className="p-10">
                      <div className="flex justify-between items-start mb-6">
                        <h3 className="text-2xl font-bold text-[#1d1d1f]">{item.client}</h3>
                        <span className="text-blue-600 font-bold text-lg">{item.impact}</span>
                      </div>
                      <p className="text-gray-500 font-medium leading-relaxed mb-8">{item.desc}</p>
                      <div className="flex flex-wrap gap-2">
                        {item.tags.map((tag, j) => (
                          <span key={j} className="px-3 py-1 rounded-full bg-gray-50 border border-gray-100 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'about' && (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="google-card p-12">
                <h2 className="text-4xl font-medium mb-8 text-[#202124]">About Website Analyzer</h2>
                <div className="prose prose-slate max-w-none text-[#3c4043]">
                  <p className="text-lg mb-6">
                    Website Analyzer is a next-generation strategic audit platform designed to help businesses and agencies unlock their full digital potential. By combining advanced AI analysis with industry-standard growth frameworks, we provide actionable insights that go beyond simple technical metrics.
                  </p>
                  
                  <h3 className="text-2xl font-medium mb-4 text-[#202124]">Our Mission</h3>
                  <p className="mb-8">
                    Our mission is to democratize high-level strategic consulting. We believe that every business, regardless of size, should have access to the same quality of insights that top-tier agencies provide. Our tool is built to bridge the gap between raw data and strategic execution.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    <div className="p-6 rounded-lg bg-[#f8f9fa] border border-[#dadce0]">
                      <h4 className="font-medium text-[#202124] mb-2">AI-Powered Intelligence</h4>
                      <p className="text-sm">We leverage the latest Gemini models to analyze content, SEO, and UX psychology in real-time.</p>
                    </div>
                    <div className="p-6 rounded-lg bg-[#f8f9fa] border border-[#dadce0]">
                      <h4 className="font-medium text-[#202124] mb-2">Agency-First Design</h4>
                      <p className="text-sm">Our white-label features allow consultants to deliver professional reports under their own brand.</p>
                    </div>
                  </div>

                  <h3 className="text-2xl font-medium mb-4 text-[#202124]">The Team</h3>
                  <p>
                    Based in the heart of the digital innovation hub, our team consists of veteran strategists, data scientists, and UX designers dedicated to building the future of web auditing.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'contact' && (
            <motion.div
              key="contact"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-5xl mx-auto"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                <div className="space-y-10">
                  <h2 className="text-5xl font-bold tracking-tight text-[#1d1d1f]">Let's engineer your <span className="text-blue-600">dominance.</span></h2>
                  <p className="text-xl text-gray-500 font-medium leading-relaxed">
                    Ready to take the next step? Our senior consultants are standing by to discuss your custom growth roadmap.
                  </p>
                  
                  <div className="space-y-6 pt-10">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                        <Globe size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Global Headquarters</p>
                        <p className="font-bold text-[#1d1d1f]">One Infinite Loop, Cupertino, CA</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                        <Briefcase size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Direct Inquiry</p>
                        <p className="font-bold text-[#1d1d1f]">strategy@apex-digital.com</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-12 rounded-[3rem] border border-black/5 shadow-2xl shadow-black/5">
                  <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-2">Full Name</label>
                      <input type="text" className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium" placeholder="John Doe" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-2">Work Email</label>
                      <input type="email" className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium" placeholder="john@enterprise.com" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-2">Strategic Objective</label>
                      <textarea className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium h-32" placeholder="Tell us about your growth goals..." />
                    </div>
                    <button className="w-full py-5 bg-blue-600 text-white rounded-2xl font-bold uppercase text-xs tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">
                      Request Consultation
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t border-black/5 py-16 px-6 text-center bg-white">
        <p className="text-gray-400 text-[11px] font-bold uppercase tracking-[0.4em]">
          Apex Digital Strategy © 2026
        </p>
      </footer>

      {/* Detailed Agency Report Modal */}
      <AnimatePresence>
        {showDetailedReport && chartData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-5xl h-full max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-[#f8f9fa]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#1a73e8] text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Briefcase size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[#202124]">Full Agency Deep Dive</h2>
                    <p className="text-sm text-[#5f6368]">Comprehensive Strategic Analysis for {analyzedUrl}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleWebShare}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#1a73e8] text-white hover:bg-[#1765cc] transition-all text-sm font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50"
                  >
                    {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
                    {isExporting ? 'Preparing PDF...' : 'Share PDF'}
                  </button>
                  <button 
                    onClick={() => handleShare('copy')}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-bold text-gray-600"
                  >
                    <Copy size={18} />
                    Copy Link
                  </button>
                  <button 
                    onClick={() => setShowDetailedReport(false)}
                    className="p-3 rounded-2xl hover:bg-gray-100 text-gray-400 transition-colors"
                  >
                    <Zap size={24} className="rotate-45" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-12">
                <div className="max-w-3xl mx-auto space-y-16">
                  {/* Agency Header */}
                  <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                      <ShieldCheck size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Confidential Strategic Deliverable</span>
                    </div>
                    <h1 className="text-5xl font-bold tracking-tight text-[#1d1d1f]">Market Dominance Roadmap</h1>
                    <p className="text-xl text-gray-500 font-medium">A multi-dimensional analysis of digital performance and competitive positioning.</p>
                    
                    {isGeneratingFullReport && (
                      <div className="mt-8 p-6 bg-blue-50 rounded-3xl border border-blue-100 flex flex-col items-center gap-4">
                        <div className="flex items-center gap-3 text-blue-600 font-bold">
                          <Loader2 className="animate-spin" size={20} />
                          <span>Generating: {currentGeneratingSection}</span>
                        </div>
                        <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-blue-600"
                            initial={{ width: 0 }}
                            animate={{ width: `${(fullReportSections.length / 10) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-blue-500 font-medium italic">Building a comprehensive 10-page dossier. This takes a few moments to ensure world-class quality.</p>
                      </div>
                    )}
                  </div>

                  {/* Detailed Analysis Content */}
                  <div className="space-y-12">
                    {fullReportSections.length > 0 ? (
                      fullReportSections.map((section, idx) => (
                        <section key={idx} className="space-y-6 pt-12 border-t border-gray-100 first:border-t-0 first:pt-0">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                              {idx + 1}
                            </div>
                            <h3 className="text-3xl font-bold text-[#1d1d1f] tracking-tight">{section.title}</h3>
                          </div>
                          <div className="prose prose-slate max-w-none text-gray-600 text-lg leading-relaxed markdown-body">
                            <Markdown>{section.content}</Markdown>
                          </div>
                        </section>
                      ))
                    ) : (
                      <section className="space-y-6">
                        <h3 className="text-2xl font-bold text-[#1d1d1f] flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Search size={18} />
                          </div>
                          Executive Strategic Overview
                        </h3>
                        <div className="prose prose-slate max-w-none text-gray-600 text-lg leading-relaxed">
                          <Markdown>{chartData.detailedAnalysis || "Analysis pending..."}</Markdown>
                        </div>
                      </section>
                    )}

                    <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="p-8 rounded-[2rem] bg-gray-50 border border-gray-100 space-y-4">
                        <h4 className="font-bold text-[#1d1d1f] flex items-center gap-2">
                          <TrendingUp size={18} className="text-green-600" />
                          Growth Opportunities
                        </h4>
                        <ul className="space-y-3">
                          {chartData.roadmap[0].tasks.map((task, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-gray-600 font-medium">
                              <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
                              {task}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-8 rounded-[2rem] bg-gray-50 border border-gray-100 space-y-4">
                        <h4 className="font-bold text-[#1d1d1f] flex items-center gap-2">
                          <AlertCircle size={18} className="text-red-600" />
                          Critical Vulnerabilities
                        </h4>
                        <p className="text-sm text-gray-600 font-medium leading-relaxed">
                          {chartData.revenueLeak.reason}
                        </p>
                        <div className="pt-4 border-t border-gray-200">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Estimated Impact</p>
                          <p className="text-2xl font-bold text-red-600">-${chartData.revenueLeak.annualLoss.toLocaleString()}/year</p>
                        </div>
                      </div>
                    </section>

                    <section className="space-y-8">
                      <h3 className="text-2xl font-bold text-[#1d1d1f]">Industry Benchmark Comparison</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {chartData.kpis.map((kpi, i) => (
                          <div key={i} className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">{kpi.name}</p>
                            <div className="flex items-baseline gap-2">
                              <span className="text-3xl font-bold text-[#1d1d1f]">{kpi.current}</span>
                              <span className="text-sm font-bold text-blue-600">/ {kpi.target}</span>
                            </div>
                            <div className="mt-4 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                                style={{ width: `${Math.min(100, (kpi.current / kpi.target) * 100)}%` }}
                              />
                            </div>
                            {kpi.explanation && (
                              <p className="mt-4 text-[10px] text-gray-500 font-medium leading-relaxed italic">
                                {kpi.explanation}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>

                  <div className="p-10 rounded-[3rem] bg-[#1d1d1f] text-white text-center space-y-6">
                    <h3 className="text-3xl font-bold tracking-tight">Ready to execute this roadmap?</h3>
                    <p className="text-gray-400 max-w-xl mx-auto">Our team of specialists is ready to help you implement these strategic recommendations and capture the projected ROI.</p>
                    <button className="google-button-primary bg-white text-[#1d1d1f] hover:bg-gray-100 px-10 py-4 text-lg">
                      Schedule Strategy Session
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl z-[100] flex items-center gap-3 ${
              toast.type === 'success' ? 'bg-[#1a73e8] text-white' : 'bg-red-600 text-white'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span className="font-medium">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

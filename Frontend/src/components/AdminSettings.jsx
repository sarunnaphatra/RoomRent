import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { 
    CreditCard, 
    Bell, 
    Calendar, 
    X, 
    Save, 
    Image as ImageIcon, 
    Upload, 
    CheckCircle,
    AlertCircle,
    Loader2,
    Globe,
    MessageSquare,
    Link,
    FileText,
    Database,
    BarChart3
} from 'lucide-react';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer 
} from 'recharts';

const AdminSettings = ({ onClose, onSaveSuccess }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('payment');
    const [qrImage, setQrImage] = useState('');
    const [preview, setPreview] = useState('');
    const [settings, setSettings] = useState({
        line_notify_token: '',
        line_chat_id: '',
        telegram_bot_token: '',
        telegram_chat_id: '',
        google_calendar_id: '',
        google_service_account_json: '',
        hotel_name: '',
        hotel_address: ''
    });
    // DB Settings State
    const [dbConfig, setDbConfig] = useState({
        host: 'PEPPER',
        user: 'sa',
        password: '123456',
        database: 'room_booking_db'
    });
    
    // Report State
    const [reportFilter, setReportFilter] = useState('week');
    const [reportData, setReportData] = useState([]);

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchSettings();
    }, []);

    useEffect(() => {
        let interval;
        if (activeTab === 'reports') {
            fetchReport();
            // Poll every 5 seconds for realtime updates
            interval = setInterval(fetchReport, 5000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [activeTab, reportFilter]);

    const fetchReport = async () => {
        try {
            // Don't set global loading as it might disable sidebar
            const res = await axios.get(`http://127.0.0.1:4455/api/reports/revenue?filter=${reportFilter}`);
            if (res.data.success) {
                setReportData(res.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch report', err);
        }
    };

    const fetchSettings = async () => {
        try {
            const keys = [
                'payment_qr_image', 
                'line_notify_token',
                'line_chat_id', 
                'telegram_bot_token', 
                'telegram_chat_id',
                'google_calendar_id',
                'google_service_account_json',
                'hotel_name',
                'hotel_address'
            ];
            
            const newSettings = { ...settings };
            
            for (const key of keys) {
                try {
                    const res = await axios.get(`http://127.0.0.1:4455/api/settings/${key}`);
                    if (res.data.success && res.data.value) {
                        if (key === 'payment_qr_image') {
                            setQrImage(res.data.value);
                            setPreview(res.data.value);
                        } else {
                            newSettings[key] = res.data.value;
                        }
                    }
                } catch (e) {
                    // Ignore error for individual key
                }
            }
            setSettings(newSettings);
        } catch (err) {
            console.error('Failed to fetch settings', err);
        }
    };

    const handleSettingChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setQrImage(reader.result);
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUrlChange = (e) => {
        setQrImage(e.target.value);
        setPreview(e.target.value);
    };

    const handleDbChange = (e) => {
        setDbConfig({ ...dbConfig, [e.target.name]: e.target.value });
    };

    const handleDbSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await axios.post('http://127.0.0.1:4455/api/config/db', dbConfig);
            setMessage({ 
                type: res.data.success ? 'success' : 'error', 
                text: res.data.message 
            });
        } catch (err) {
            console.error(err);
            setMessage({ 
                type: 'error', 
                text: err.response?.data?.message || 'Failed to connect/save configuration' 
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            await axios.post('http://127.0.0.1:4455/api/settings', {
                key: 'payment_qr_image',
                value: qrImage
            });

            for (const [key, value] of Object.entries(settings)) {
                await axios.post('http://127.0.0.1:4455/api/settings', {
                    key,
                    value
                });
            }

            setMessage({ type: 'success', text: t('settingsSaved') });
            if (onSaveSuccess) onSaveSuccess();
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (err) {
            setMessage({ type: 'error', text: t('settingsSaveFailed') });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-screen md:h-[90vh] flex flex-col md:flex-row md:overflow-hidden ring-1 ring-slate-900/5">
                
                {/* Sidebar */}
                <div className="w-full md:w-72 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col overflow-y-auto">
                    <div className="p-6 border-b border-slate-200/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-600 rounded-lg text-white">
                                <Globe size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">{t('adminSettings')}</h3>
                        </div>
                    </div>
                    
                    <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                        <TabButton 
                            id="payment" 
                            label={t('paymentQR')} 
                            description="Manage payment methods"
                            icon={CreditCard} 
                            active={activeTab === 'payment'} 
                            onClick={setActiveTab} 
                        />
                        <TabButton 
                            id="notifications" 
                            label={t('notifications')} 
                            description="Line & Telegram setup"
                            icon={Bell} 
                            active={activeTab === 'notifications'} 
                            onClick={setActiveTab} 
                        />
                        <TabButton 
                            id="calendar" 
                            label={t('googleCalendar')} 
                            description="Sync bookings automatically"
                            icon={Calendar} 
                            active={activeTab === 'calendar'} 
                            onClick={setActiveTab} 
                        />
                        <TabButton 
                            id="receipt" 
                            label={t('receiptSettings')} 
                            description="Hotel Name & Address"
                            icon={FileText} 
                            active={activeTab === 'receipt'} 
                            onClick={setActiveTab} 
                        />
                        <TabButton 
                            id="database" 
                            label={t('dbSettings')} 
                            description="Connection configuration"
                            icon={Database} 
                            active={activeTab === 'database'} 
                            onClick={setActiveTab} 
                        />
                        <TabButton 
                            id="reports" 
                            label={t('reports')} 
                            description="Revenue & Statistics"
                            icon={BarChart3} 
                            active={activeTab === 'reports'} 
                            onClick={setActiveTab} 
                        />
                    </nav>

                    <div className="p-4 border-t border-slate-200 text-xs text-slate-400 text-center">
                        v1.0.0 • Admin Console
                    </div>
                </div>

                {/* Mobile Content (accordion-style under sidebar) */}
                <div className="md:hidden w-full bg-white">
                    <div className="p-4 border-t border-slate-200">
                        <div className="text-lg font-bold text-slate-800 mb-2">
                            {activeTab === 'payment' && t('paymentQR')}
                            {activeTab === 'notifications' && t('notifications')}
                            {activeTab === 'calendar' && t('googleCalendar')}
                            {activeTab === 'receipt' && t('receiptSettings')}
                            {activeTab === 'database' && t('dbSettings')}
                        </div>
                        <div className="space-y-8">
                            {activeTab === 'payment' && (
                                <div className="space-y-6">
                                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-blue-700 text-sm">
                                        <div className="shrink-0 mt-0.5">
                                            <AlertCircle size={16} />
                                        </div>
                                        <p>Upload the QR Code that will be displayed to customers during checkout. Make sure it is clear and valid.</p>
                                    </div>

                                    <div className="space-y-6">
                                        <label className="block text-sm font-semibold text-slate-700">{t('paymentQRImage')}</label>
                                        
                                        <div className="grid grid-cols-1 gap-6">
                                            <div className="space-y-4">
                                                <div className="relative group">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                                        <Link size={16} />
                                                    </div>
                                                    <input 
                                                        type="text" 
                                                        placeholder={t('enterImageURL')}
                                                        value={qrImage}
                                                        onChange={handleUrlChange}
                                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm"
                                                    />
                                                </div>

                                                <div className="relative">
                                                    <div className="absolute inset-0 flex items-center">
                                                        <div className="w-full border-t border-slate-200"></div>
                                                    </div>
                                                    <div className="relative flex justify-center text-xs uppercase">
                                                        <span className="bg-white px-2 text-slate-400 font-medium">{t('or')}</span>
                                                    </div>
                                                </div>

                                                <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 hover:border-blue-400 transition-all group">
                                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                        <Upload className="w-8 h-8 mb-2 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                                        <p className="text-xs text-slate-500 group-hover:text-blue-600 font-medium">Click to upload file</p>
                                                    </div>
                                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                                </label>
                                            </div>

                                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center min-h-[160px]">
                                                {preview ? (
                                                    <div className="relative group">
                                                        <p className="text-xs font-medium text-slate-500 mb-3 text-center">{t('preview')}</p>
                                                        <img src={preview} alt="QR Preview" className="max-h-40 rounded-lg shadow-sm" />
                                                    </div>
                                                ) : (
                                                    <div className="text-center text-slate-400">
                                                        <ImageIcon size={48} className="mx-auto mb-2 opacity-50" />
                                                        <p className="text-sm">No image selected</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'notifications' && (
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                            <div className="w-8 h-8 bg-[#00B900] rounded-lg flex items-center justify-center text-white">
                                                <MessageSquare size={18} />
                                            </div>
                                            <h3 className="font-semibold text-slate-800">Line Notify</h3>
                                        </div>
                                        <div className="grid gap-4">
                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium text-slate-600">{t('lineNotifyToken')}</label>
                                                <input 
                                                    type="text" 
                                                    value={settings.line_notify_token}
                                                    onChange={(e) => handleSettingChange('line_notify_token', e.target.value)}
                                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00B900]/20 focus:border-[#00B900] transition-all outline-none text-sm"
                                                    placeholder={t('enterLineNotifyToken')}
                                                />
                                                <p className="text-xs text-slate-400">Get token from <a href="https://notify-bot.line.me/my/" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">Line Notify My Page</a></p>
                                            </div>
                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium text-slate-600">{t('lineChatID')}</label>
                                                <input 
                                                    type="text" 
                                                    value={settings.line_chat_id}
                                                    onChange={(e) => handleSettingChange('line_chat_id', e.target.value)}
                                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00B900]/20 focus:border-[#00B900] transition-all outline-none text-sm"
                                                    placeholder={t('enterLineChatID')}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                            <div className="w-8 h-8 bg-[#0088cc] rounded-lg flex items中心 justify-center text-white">
                                                <MessageSquare size={18} />
                                            </div>
                                            <h3 className="font-semibold text-slate-800">Telegram</h3>
                                        </div>
                                        <div className="grid gap-4">
                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium text-slate-600">{t('telegramBotToken')}</label>
                                                <input 
                                                    type="text" 
                                                    value={settings.telegram_bot_token}
                                                    onChange={(e) => handleSettingChange('telegram_bot_token', e.target.value)}
                                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0088cc]/20 focus:border-[#0088cc] transition-all outline-none text-sm"
                                                    placeholder={t('enterTelegramBotToken')}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium text-slate-600">{t('telegramChatID')}</label>
                                                <input 
                                                    type="text" 
                                                    value={settings.telegram_chat_id}
                                                    onChange={(e) => handleSettingChange('telegram_chat_id', e.target.value)}
                                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0088cc]/20 focus:border-[#0088cc] transition-all outline-none text-sm"
                                                    placeholder={t('enterTelegramChatID')}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'calendar' && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                        <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-blue-600 shadow-sm">
                                            <Calendar size={18} />
                                        </div>
                                        <h3 className="font-semibold text-slate-800">Google Calendar Integration</h3>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium text-slate-600">{t('googleCalendarID')}</label>
                                            <input 
                                                type="text" 
                                                value={settings.google_calendar_id}
                                                onChange={(e) => handleSettingChange('google_calendar_id', e.target.value)}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm"
                                                placeholder={t('exampleCalendarID')}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium text-slate-600">{t('googleServiceAccountJSON')}</label>
                                            <div className="relative">
                                                <textarea 
                                                    rows="10"
                                                    value={settings.google_service_account_json}
                                                    onChange={(e) => handleSettingChange('google_service_account_json', e.target.value)}
                                                    className="w-full px-4 py-3 bg-slate-900 text-slate-50 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all outline-none text-xs font-mono leading-relaxed"
                                                    placeholder='{ "type": "service_account", ... }'
                                                />
                                                <div className="absolute top-3 right-3 px-2 py-1 bg-slate-800 rounded text-[10px] text-slate-400 font-mono">
                                                    JSON
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-500">Paste the full content of your Google Service Account JSON key file here.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'receipt' && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                            <FileText size={18} />
                                        </div>
                                        <h3 className="font-semibold text-slate-800">{t('receiptSettings')}</h3>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium text-slate-600">{t('hotelNameLabel')}</label>
                                            <input 
                                                type="text" 
                                                value={settings.hotel_name}
                                                onChange={(e) => handleSettingChange('hotel_name', e.target.value)}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm"
                                                placeholder="RoomBookingApp Hotel"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium text-slate-600">{t('hotelAddressLabel')}</label>
                                            <textarea 
                                                rows="3"
                                                value={settings.hotel_address}
                                                onChange={(e) => handleSettingChange('hotel_address', e.target.value)}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm"
                                                placeholder="123 Sukhumvit Road, Bangkok, Thailand"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="mt-6 flex items-center justify-between">
                            <button 
                                onClick={onClose}
                                className="px-6 py-2.5 text-slate-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-xl font-medium transition-all"
                            >
                                {t('cancel')}
                            </button>
                            <button 
                                onClick={handleSave}
                                disabled={loading}
                                className="px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg transition-all flex items-center gap-2"
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                {loading ? t('saving') : t('saveSettings')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="hidden md:flex md:flex-col md:flex-1 min-w-0 bg-white">
                    {/* Header */}
                    <div className="h-16 border-b border-slate-200 flex items-center justify-between px-4 md:px-8 bg-white/80 backdrop-blur-md md:sticky md:top-0 md:z-10">
                        <h2 className="text-xl font-bold text-slate-800">
                            {activeTab === 'payment' && t('paymentQR')}
                            {activeTab === 'notifications' && t('notifications')}
                            {activeTab === 'calendar' && t('googleCalendar')}
                            {activeTab === 'receipt' && t('receiptSettings')}
                        </h2>
                        <button 
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-8">
                        <div className="max-w-3xl mx-auto space-y-8">
                            {activeTab === 'payment' && (
                                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-blue-700 text-sm">
                                        <div className="shrink-0 mt-0.5">
                                            <AlertCircle size={16} />
                                        </div>
                                        <p>Upload the QR Code that will be displayed to customers during checkout. Make sure it is clear and valid.</p>
                                    </div>

                                    <div className="space-y-6">
                                        <label className="block text-sm font-semibold text-slate-700">{t('paymentQRImage')}</label>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <div className="relative group">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                                        <Link size={16} />
                                                    </div>
                                                    <input 
                                                        type="text" 
                                                        placeholder={t('enterImageURL')}
                                                        value={qrImage}
                                                        onChange={handleUrlChange}
                                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm"
                                                    />
                                                </div>

                                                <div className="relative">
                                                    <div className="absolute inset-0 flex items-center">
                                                        <div className="w-full border-t border-slate-200"></div>
                                                    </div>
                                                    <div className="relative flex justify-center text-xs uppercase">
                                                        <span className="bg-white px-2 text-slate-400 font-medium">{t('or')}</span>
                                                    </div>
                                                </div>

                                                <label className="flex flex-col items-center justify-center w-full h-36 md:h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 hover:border-blue-400 transition-all group">
                                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                        <Upload className="w-8 h-8 mb-2 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                                        <p className="text-xs text-slate-500 group-hover:text-blue-600 font-medium">Click to upload file</p>
                                                    </div>
                                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                                </label>
                                            </div>

                                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center min-h-[160px] md:min-h-[200px]">
                                                {preview ? (
                                                    <div className="relative group">
                                                        <p className="text-xs font-medium text-slate-500 mb-3 text-center">{t('preview')}</p>
                                                        <img src={preview} alt="QR Preview" className="max-h-40 md:max-h-48 rounded-lg shadow-sm" />
                                                    </div>
                                                ) : (
                                                    <div className="text-center text-slate-400">
                                                        <ImageIcon size={48} className="mx-auto mb-2 opacity-50" />
                                                        <p className="text-sm">No image selected</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'notifications' && (
                                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
                                    {/* Line Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                            <div className="w-8 h-8 md:w-9 md:h-9 bg-[#00B900] rounded-lg flex items-center justify-center text-white">
                                                <MessageSquare size={18} />
                                            </div>
                                            <h3 className="font-semibold text-slate-800">Line Notify</h3>
                                        </div>
                                        <div className="grid gap-4">
                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium text-slate-600">{t('lineNotifyToken')}</label>
                                                <input 
                                                    type="text" 
                                                    value={settings.line_notify_token}
                                                    onChange={(e) => handleSettingChange('line_notify_token', e.target.value)}
                                                    className="w-full px-3 md:px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00B900]/20 focus:border-[#00B900] transition-all outline-none text-sm"
                                                    placeholder={t('enterLineNotifyToken')}
                                                />
                                                <p className="text-xs text-slate-400">Get token from <a href="https://notify-bot.line.me/my/" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">Line Notify My Page</a></p>
                                            </div>
                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium text-slate-600">{t('lineChatID')}</label>
                                                <input 
                                                    type="text" 
                                                    value={settings.line_chat_id}
                                                    onChange={(e) => handleSettingChange('line_chat_id', e.target.value)}
                                                    className="w-full px-3 md:px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00B900]/20 focus:border-[#00B900] transition-all outline-none text-sm"
                                                    placeholder={t('enterLineChatID')}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Telegram Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                            <div className="w-8 h-8 md:w-9 md:h-9 bg-[#0088cc] rounded-lg flex items-center justify-center text-white">
                                                <MessageSquare size={18} />
                                            </div>
                                            <h3 className="font-semibold text-slate-800">Telegram</h3>
                                        </div>
                                        <div className="grid gap-4">
                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium text-slate-600">{t('telegramBotToken')}</label>
                                                <input 
                                                    type="text" 
                                                    value={settings.telegram_bot_token}
                                                    onChange={(e) => handleSettingChange('telegram_bot_token', e.target.value)}
                                                    className="w-full px-3 md:px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0088cc]/20 focus:border-[#0088cc] transition-all outline-none text-sm"
                                                    placeholder={t('enterTelegramBotToken')}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium text-slate-600">{t('telegramChatID')}</label>
                                                <input 
                                                    type="text" 
                                                    value={settings.telegram_chat_id}
                                                    onChange={(e) => handleSettingChange('telegram_chat_id', e.target.value)}
                                                    className="w-full px-3 md:px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0088cc]/20 focus:border-[#0088cc] transition-all outline-none text-sm"
                                                    placeholder={t('enterTelegramChatID')}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'calendar' && (
                                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                        <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-blue-600 shadow-sm">
                                            <Calendar size={18} />
                                        </div>
                                        <h3 className="font-semibold text-slate-800">Google Calendar Integration</h3>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium text-slate-600">{t('googleCalendarID')}</label>
                                            <input 
                                                type="text" 
                                                value={settings.google_calendar_id}
                                                onChange={(e) => handleSettingChange('google_calendar_id', e.target.value)}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm"
                                                placeholder={t('exampleCalendarID')}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium text-slate-600">{t('googleServiceAccountJSON')}</label>
                                            <div className="relative">
                                                <textarea 
                                                    rows="10"
                                                    value={settings.google_service_account_json}
                                                    onChange={(e) => handleSettingChange('google_service_account_json', e.target.value)}
                                                    className="w-full px-4 py-3 bg-slate-900 text-slate-50 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all outline-none text-xs font-mono leading-relaxed"
                                                    placeholder='{ "type": "service_account", ... }'
                                                />
                                                <div className="absolute top-3 right-3 px-2 py-1 bg-slate-800 rounded text-[10px] text-slate-400 font-mono">
                                                    JSON
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-500">Paste the full content of your Google Service Account JSON key file here.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'receipt' && (
                                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                            <FileText size={18} />
                                        </div>
                                        <h3 className="font-semibold text-slate-800">{t('receiptSettings')}</h3>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium text-slate-600">{t('hotelNameLabel')}</label>
                                            <input 
                                                type="text" 
                                                value={settings.hotel_name}
                                                onChange={(e) => handleSettingChange('hotel_name', e.target.value)}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm"
                                                placeholder="RoomBookingApp Hotel"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium text-slate-600">{t('hotelAddressLabel')}</label>
                                            <textarea 
                                                rows="3"
                                                value={settings.hotel_address}
                                                onChange={(e) => handleSettingChange('hotel_address', e.target.value)}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm"
                                                placeholder="123 Sukhumvit Road, Bangkok, Thailand"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'database' && (
                                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                        <div className="w-8 h-8 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center">
                                            <Database size={18} />
                                        </div>
                                        <h3 className="font-semibold text-slate-800">{t('dbSettings')}</h3>
                                    </div>

                                    <form onSubmit={handleDbSave} className="space-y-4">
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium text-slate-600">{t('dbHost')}</label>
                                            <input 
                                                type="text" 
                                                name="host"
                                                value={dbConfig.host}
                                                onChange={handleDbChange}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm"
                                                required
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium text-slate-600">{t('dbUser')}</label>
                                            <input 
                                                type="text" 
                                                name="user"
                                                value={dbConfig.user}
                                                onChange={handleDbChange}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm"
                                                required
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium text-slate-600">{t('dbPassword')}</label>
                                            <input 
                                                type="password" 
                                                name="password"
                                                value={dbConfig.password}
                                                onChange={handleDbChange}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm"
                                                required
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium text-slate-600">{t('dbName')}</label>
                                            <input 
                                                type="text" 
                                                name="database"
                                                value={dbConfig.database}
                                                onChange={handleDbChange}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm"
                                                required
                                            />
                                        </div>

                                        <div className="pt-4 border-t border-slate-100 flex justify-end">
                                            <button 
                                                type="submit"
                                                disabled={loading}
                                                className="px-8 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg shadow-slate-200 hover:shadow-slate-300 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                                            >
                                                {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                                {loading ? t('saving') : t('saveDbSettings')}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {activeTab === 'reports' && (
                                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300 h-full flex flex-col">
                                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                                                <BarChart3 size={18} />
                                            </div>
                                            <h3 className="font-semibold text-slate-800">{t('revenueReport')}</h3>
                                        </div>
                                        <div className="flex bg-slate-100 rounded-lg p-1">
                                            {['week', 'month', 'year'].map((filter) => (
                                                <button
                                                    key={filter}
                                                    onClick={() => setReportFilter(filter)}
                                                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                                                        reportFilter === filter 
                                                        ? 'bg-white text-slate-800 shadow-sm' 
                                                        : 'text-slate-500 hover:text-slate-700'
                                                    }`}
                                                >
                                                    {t(filter)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-2xl border border-slate-100 p-4 h-[500px]">
                                        {loading && reportData.length === 0 ? (
                                            <div className="h-full flex items-center justify-center text-slate-400">
                                                <Loader2 className="animate-spin mb-2" />
                                            </div>
                                        ) : (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={reportData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => `฿${value.toLocaleString()}`} />
                                                    <Tooltip 
                                                        cursor={{ fill: '#f8fafc' }}
                                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                        formatter={(value) => [`฿${value.toLocaleString()}`, undefined]}
                                                    />
                                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                                    <Bar name={t('currentPeriod')} dataKey="current" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                                    <Bar name={t('lastYearPeriod')} dataKey="lastYear" fill="#cbd5e1" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                         <div className="flex-1">
                            {message.text && (
                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium animate-in fade-in slide-in-from-left-2 ${
                                    message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                    {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                    {message.text}
                                </div>
                            )}
                         </div>
                        <div className="flex gap-3">
                            <button 
                                onClick={onClose}
                                className="px-6 py-2.5 text-slate-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-xl font-medium transition-all"
                            >
                                {t('cancel')}
                            </button>
                            {activeTab !== 'database' && activeTab !== 'reports' && (
                                <button 
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                                >
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                    {loading ? t('saving') : t('saveSettings')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TabButton = ({ id, label, description, icon: Icon, active, onClick }) => (
    <button 
        onClick={() => onClick(id)}
        className={`w-full text-left p-3 rounded-xl transition-all group ${
            active 
            ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100' 
            : 'text-slate-600 hover:bg-slate-100'
        }`}
    >
        <div className="flex items-start gap-3">
            <Icon size={20} className={`mt-0.5 ${active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
            <div>
                <div className={`font-medium ${active ? 'text-blue-900' : 'text-slate-700'}`}>{label}</div>
                {description && <div className={`text-xs mt-0.5 ${active ? 'text-blue-500' : 'text-slate-400'}`}>{description}</div>}
            </div>
        </div>
    </button>
);

export default AdminSettings;

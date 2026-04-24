import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const SlipUploadModal = ({ bookingId, onClose, onUploadSuccess }) => {
    const { t } = useTranslation();
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setMessage('Please select a file');
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('slip', file);
        formData.append('bookingId', bookingId);

        try {
            const res = await axios.post('http://127.0.0.1:4455/api/upload-slip', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            onUploadSuccess(res.data.slipImage);
        } catch (err) {
            console.error(err);
            setMessage('Failed to upload slip');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 relative text-center max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-bold mb-4">{t('uploadSlip')}</h3>
                
                <div className="mb-4">
                    <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100"
                    />
                </div>

                {preview && (
                    <div className="mb-4 p-2 border rounded bg-gray-50">
                        <img src={preview} alt="Slip Preview" className="max-h-48 mx-auto" />
                    </div>
                )}

                {message && <div className="text-red-500 mb-2 text-sm">{message}</div>}

                <div className="flex gap-3">
                    <button 
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                        {t('cancelUpload')}
                    </button>
                    <button 
                        onClick={handleUpload}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        disabled={loading || !file}
                    >
                        {loading ? '...' : t('confirmUpload')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SlipUploadModal;

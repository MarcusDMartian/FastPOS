import React, { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle, Send, User, Mail, Phone, Building, Ticket } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Button } from './Button';

interface LeadFormModalProps {
  onClose: () => void;
  source?: string; // To track which button opened the form
}

// Helper: Generate Ticket ID [FastYear][dd-mm-yy][xxx]
const generateTicketId = () => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear()).slice(-2); // Lấy 2 số cuối của năm
  const dateStr = `${day}-${month}-${year}`; // dd-mm-yy

  // Key lưu trữ trong localStorage
  const STORAGE_KEY_DATE = 'fastpos_lead_date';
  const STORAGE_KEY_COUNT = 'fastpos_lead_count';

  const lastDate = localStorage.getItem(STORAGE_KEY_DATE);
  let count = 1;

  if (lastDate === dateStr) {
    // Nếu vẫn là ngày hôm nay, lấy số đếm cũ + 1
    const lastCount = parseInt(localStorage.getItem(STORAGE_KEY_COUNT) || '0', 10);
    count = lastCount + 1;
  } else {
    // Nếu là ngày mới, reset về 1 (Code tự động chạy reset mỗi ngày dựa trên so sánh ngày)
    count = 1;
  }

  // Lưu lại trạng thái mới
  localStorage.setItem(STORAGE_KEY_DATE, dateStr);
  localStorage.setItem(STORAGE_KEY_COUNT, count.toString());

  // Format số thứ tự thành 3 chữ số (001, 002...)
  const countStr = String(count).padStart(3, '0');

  return `[FastYear][${dateStr}][${countStr}]`;
};

export const LeadFormModal: React.FC<LeadFormModalProps> = ({ onClose, source = 'General' }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    note: ''
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [ticketId, setTicketId] = useState('');

  // Validation Check: Name, Email, Phone are required
  const isFormValid = formData.name.trim().length > 0 &&
    formData.email.trim().length > 0 &&
    formData.phone.trim().length > 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return; // Double check

    setLoading(true);

    try {
      // 1. GENERATE TICKET ID
      const newTicketId = generateTicketId();
      setTicketId(newTicketId);

      // 2. SIMULATE SENDING EMAIL TO ADMIN (marknguyen.hiworld@gmail.com)
      // Trong môi trường Production, đoạn này sẽ gọi API backend gửi mail thật.
      // Ví dụ: await fetch('/api/send-email', { method: 'POST', body: ... })
      console.group("📧 SIMULATING EMAIL SENDING TO ADMIN");
      console.log("To: marknguyen.hiworld@gmail.com");
      console.log("Subject:", newTicketId);
      console.log("Body:", {
        ...formData,
        source: source,
        timestamp: new Date().toISOString()
      });
      console.groupEnd();

      // 3. GENERATE AUTO-REPLY EMAIL USING AI (Customer Facing)
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const result = await model.generateContent(`
          Bạn là hệ thống trả lời tự động của công ty FastPOS.
          Khách hàng tên là "${formData.name}" vừa đăng ký tư vấn qua website.
          Mã hồ sơ (Ticket ID) của họ là: ${newTicketId}.
          Hãy viết một email phản hồi (chỉ nội dung email, không cần tiêu đề phụ) với giọng văn:
          1. Cực kỳ trang trọng, chuyên nghiệp (Formal).
          2. Cảm ơn khách hàng đã quan tâm đến giải pháp FastPOS.
          3. Xác nhận đã nhận được thông tin (SĐT: ${formData.phone}).
          4. Nhắc đến Mã hồ sơ ${newTicketId} để họ tiện theo dõi.
          5. Thông báo rằng chuyên viên tư vấn sẽ liên hệ lại trong vòng 2 giờ làm việc.
          6. Ký tên: Ban Quản Trị FastPOS.
        `);

      const emailContent = result.response.text() || "Cảm ơn bạn đã đăng ký. Chúng tôi sẽ liên hệ sớm.";
      setGeneratedEmail(emailContent);

      setStep('success');
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative flex flex-col max-h-[90vh]">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors z-10"
        >
          <X size={20} className="text-gray-500" />
        </button>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {step === 'form' ? (
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="w-12 h-12 bg-accent-orange/10 text-accent-orange rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Send size={24} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Đăng Ký Tư Vấn</h2>
                <p className="text-sm text-gray-500">
                  Để lại thông tin, chuyên gia FastPOS sẽ liên hệ demo giải pháp cho doanh nghiệp của bạn.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-4">
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-accent-orange transition-colors" size={18} />
                    <input
                      required
                      name="name"
                      type="text"
                      placeholder="Họ và tên của bạn (*)"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-accent-orange focus:ring-2 focus:ring-accent-orange/20 transition-all outline-none"
                    />
                  </div>

                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-accent-orange transition-colors" size={18} />
                    <input
                      required
                      name="email"
                      type="email"
                      placeholder="Email công việc (*)"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-accent-orange focus:ring-2 focus:ring-accent-orange/20 transition-all outline-none"
                    />
                  </div>

                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-accent-orange transition-colors" size={18} />
                    <input
                      required
                      name="phone"
                      type="tel"
                      placeholder="Số điện thoại (*)"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-accent-orange focus:ring-2 focus:ring-accent-orange/20 transition-all outline-none"
                    />
                  </div>

                  <div className="relative group">
                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-accent-orange transition-colors" size={18} />
                    <input
                      name="company"
                      type="text"
                      placeholder="Tên doanh nghiệp / Cửa hàng"
                      value={formData.company}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-accent-orange focus:ring-2 focus:ring-accent-orange/20 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    fullWidth
                    variant="primary"
                    disabled={loading || !isFormValid}
                    className={`py-4 text-lg shadow-accent-orange/30 ${!isFormValid ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={!isFormValid ? "Vui lòng điền đầy đủ thông tin bắt buộc" : "Gửi thông tin"}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="animate-spin" /> Đang xử lý...
                      </div>
                    ) : (
                      'Xác Nhận & Nhận Tư Vấn'
                    )}
                  </Button>
                </div>

                <p className="text-xs text-center text-gray-400 mt-4">
                  Thông tin của bạn được bảo mật an toàn theo chính sách của FastPOS.
                </p>
              </form>
            </div>
          ) : (
            <div className="p-8 h-full flex flex-col">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <CheckCircle size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Đăng Ký Thành Công!</h2>
                <p className="text-gray-500 mt-2">Hệ thống đã ghi nhận yêu cầu của bạn.</p>

                {/* Display Ticket ID */}
                <div className="mt-4 inline-flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg border border-gray-200">
                  <Ticket size={16} className="text-gray-500" />
                  <span className="font-mono font-bold text-gray-700">{ticketId}</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">(Email thông báo đã được gửi đến Admin)</p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex-1 overflow-y-auto mb-6">
                <div className="flex items-center gap-2 mb-3 border-b border-gray-200 pb-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">AI Auto-Reply Sent</span>
                </div>
                <div className="prose prose-sm prose-gray max-w-none">
                  <p className="whitespace-pre-line text-gray-700 italic">
                    {generatedEmail}
                  </p>
                </div>
              </div>

              <Button onClick={onClose} fullWidth variant="secondary">
                Đóng
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
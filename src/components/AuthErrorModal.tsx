import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShieldAlert, Copy, Check, ExternalLink, RefreshCw, X } from "lucide-react";

interface AuthErrorModalProps {
  error: { code?: string; message?: string } | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthErrorModal({ error, isOpen, onClose }: AuthErrorModalProps) {
  const [copied, setCopied] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch (e) {
      setIsInIframe(true);
    }
  }, []);

  if (!isOpen || !error) return null;

  const code = error.code || "unknown";
  const message = error.message || "An unexpected error occurred.";
  const hostname = window.location.hostname;
  const currentUrl = window.location.href;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(hostname);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy hostname", err);
    }
  };

  const handleOpenNewTab = () => {
    window.open(currentUrl, "_blank");
  };

  // Content helper based on exact error
  const getErrorExplanation = () => {
    switch (code) {
      case "auth/unauthorized-domain":
        return {
          titleAr: "الدومين الحالي غير مصرح به",
          titleEn: "Unauthorized Domain Error",
          descAr: "قامت حماية Firebase بحظر محاولة تسجيل الدخول لأن هذا النطاق (Domain) غير مضاف لقائمة النطاقات المعتمدة لديك.",
          descEn: "Firebase Security blocked this login attempt because the current hostname is not in your authorized list.",
          steps: [
            `اضغط على الزر أدناه لنسخ الدومين الحالي: ${hostname}`,
            "اذهب لوحدة تحكم Firebase Console الخاصة ببرنامجك.",
            "ادخل على Authentication > Settings > Authorized domains.",
            "اضغط على Add domain وقم بلصق الدومين الذي تم نسخه.",
            "ملاحظة: إذا كنت تستخدم Vercel أو ترفع الموقع على رابط جديد، يجب إدراج كل رابط تجريبي طويل أيضاً."
          ]
        };
      case "auth/operation-not-allowed":
        return {
          titleAr: "خيار تسجيل الدخول عبر Google غير مفعل",
          titleEn: "Google Sign-in Not Enabled",
          descAr: "لم يتم تفعيل تسجيل الدخول بواسطة Google في لوحة تحكم Firebase الخاصة بمشروعك.",
          descEn: "Google authentication provider is not enabled in your Firebase project configurations yet.",
          steps: [
            "افتح لوحة تحكم Firebase Console.",
            "توجه إلى Authentication ثم تبويب Sign-in method.",
            "اضغط على Add new provider واختر Google.",
            "قم بتفعيل الخيار (Enable) ثم اضغط حفظ (Save)."
          ]
        };
      case "auth/popup-blocked":
        return {
          titleAr: "تم حظر النافذة المنبثقة",
          titleEn: "Popup Blocked by Browser",
          descAr: "قام متصفحك بحظر نافذة تسجيل الدخول المنبثقة التابعة لـ Google تلقائياً للتأمين.",
          descEn: "Your web browser automatically blocked the interactive Google authentication pop-up window.",
          steps: [
            "انظر لأعلى يمين أو يسار شريط العنوان بالمتصفح، ستجد رمز نافذة منبثقة محظورة.",
            "اضغط عليه واختر السماح بالنوافذ المنبثقة لهذا الموقع دائماً (Always Allow).",
            "أو اضغط على زر 'الفتح في نافذة مستقلة' أدناه لتجنب قيود الإطار (iFrame)."
          ]
        };
      case "auth/popup-closed-by-user":
        return {
          titleAr: "تم إغلاق نافذة تسجيل الدخول",
          titleEn: "Login Popup Closed",
          descAr: "تم إغلاق نافذة تسجيل الدخول عبر Google قبل استكمال عملية التحقق.",
          descEn: "The Google authentication popup window was closed before completing the verification process.",
          steps: [
            "يرجى الضغط على زر تسجيل الدخول مرة أخرى.",
            "يرجى الاستمرار حتى يتم اختيار حسابك وتأكيد العملية بنجاح."
          ]
        };
      default:
        return {
          titleAr: "حدث خطأ أثناء تسجيل الدخول",
          titleEn: "Authentication Failure",
          descAr: `تفاصيل الخطأ: ${message} (رمز الخطأ: ${code})`,
          descEn: `Error details: ${message} (Code: ${code})`,
          steps: [
            "يرجى التحقق من اتصالك بالإنترنت ثم إدخال المحاولة مجدداً.",
            "ملاحظة عامة: النوافذ المنبثقة والتحقق قد تواجه شروطاً خاصة داخل النوافذ المعشقة (iFrame) الخاصة بمحرر الأكواد. يفضل تجربة فتح الموقع في صفحة مستقلة دائماً."
          ]
        };
    }
  };

  const exp = getErrorExplanation();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-xl"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto glass rounded-3xl p-6 md:p-8 text-white border border-white/15 shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400">
                <ShieldAlert size={28} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-serif font-bold text-red-200 text-right md:text-left">
                  {exp.titleAr}
                </h3>
                <p className="text-xs text-white/40 uppercase tracking-widest font-mono mt-0.5">
                  {exp.titleEn}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* Description Section */}
          <div className="space-y-3 mb-6 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm leading-relaxed text-right" dir="rtl">
            <p className="text-white/80 font-medium">{exp.descAr}</p>
            <p className="text-white/40 text-xs italic text-left" dir="ltr">
              {exp.descEn}
            </p>
          </div>

          {/* Steps list */}
          <div className="mb-6 space-y-3 text-right" dir="rtl">
            <h4 className="text-silver uppercase tracking-widest text-xs font-bold mb-2">خطوات الحل الإرشادي:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-white/70 font-light pl-2">
              {exp.steps.map((step, idx) => (
                <li key={idx} className="leading-relaxed">
                  <span className="text-white/80">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-auto">
            {code === "auth/unauthorized-domain" && (
              <button
                onClick={handleCopy}
                className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all"
              >
                {copied ? (
                  <>
                    <Check size={16} className="text-green-400 animate-bounce" />
                    <span>تم نسخ الدومين!</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} className="text-silver" />
                    <span>نسخ الدومين الحالي</span>
                  </>
                )}
              </button>
            )}

            {isInIframe && (
              <button
                onClick={handleOpenNewTab}
                className="flex-1 py-3 px-4 bg-silver text-black hover:bg-white rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all shadow-lg shadow-white/5"
              >
                <ExternalLink size={16} />
                <span>الفتح في صفحة جديدة</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="py-3 px-6 bg-white text-black hover:bg-silver-light rounded-xl text-sm font-bold transition-all sm:w-auto w-full text-center"
            >
              موافق
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-[10px] text-white/30 font-mono">
            <span>DOMAIN: {hostname}</span>
            <span>CODE: {code}</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

type ApplicationModalProps = {
  open: boolean;
  projectName: string | null;
  onClose: () => void;
};

export default function ApplicationModal(props: ApplicationModalProps) {
  const { open, projectName, onClose } = props;

  const [render, setRender] = useState(open);
  // 初始为 false，确保首次打开也有入场动画
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (open) {
      setRender(true);
      // double rAF 确保浏览器先绘制初始状态，再切换到目标状态触发动画
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setShow(true));
      });
    } else {
      setShow(false);
      const t = setTimeout(() => setRender(false), 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!render || !projectName) return null;

  // Build target url relative to current location
  const src = `/workspace/${projectName}/index.html`;

  const content = (
    <div className="fixed inset-0" style={{ zIndex: 1000 }}>
      <div className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${show ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className={`pt-12 relative bg-gray-50 border-4 border-slate-200 rounded-2xl shadow-xl w-[375px] h-[80vh] overflow-hidden transition duration-200 ${show ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95'}`}>
          <button
            onClick={onClose}
            className="absolute top-2 right-2 z-10 h-8 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
            aria-label="Close"
          >
            Close
          </button>
          <iframe title={projectName} src={src} className="w-full h-full border-1 border-slate-200 rounded-b-2xl" />
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}



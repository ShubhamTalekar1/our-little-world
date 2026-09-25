import { motion } from 'framer-motion';

export default function PageHeader({ eyebrow, title, subtitle, children }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="text-3xl font-light text-cream sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-xl text-[15px] text-muted">{subtitle}</p>}
      </motion.div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

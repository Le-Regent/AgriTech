import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SIDEBAR_NAV, MARKETPLACE_NAV } from '@/constants';
import { useUser } from '@/context/UserContext';
import { useLanguage } from '@/context/LanguageContext';

interface SidebarProps {
  onMobileClose?: () => void;
}

export function Sidebar({ onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useUser();
  const { t } = useLanguage();

  const renderNavItems = (items: typeof SIDEBAR_NAV, titleKey: string) => {
    let filteredItems = items.filter(item => !item.roles || (user && item.roles.includes(user.user_type || '')));
    
    // Add Admin Command Center if user is admin
    if (titleKey === 'main_menu' && user?.is_admin) {
      filteredItems = [
        ...filteredItems,
        {
          label: 'Admin Panel',
          icon: 'admin_panel_settings',
          path: '/admin',
        }
      ];
    }

    if (filteredItems.length === 0) return null;

    return (
      <div className="space-y-1">
        <p className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
          {t(titleKey)}
        </p>
        {filteredItems.map((item) => {
          const isActive = pathname === item.path;
          const labelKey = item.label.toLowerCase().replace(/\s+/g, '_');
          return (
            <Link
              key={item.path}
              href={item.path}
              id={`${item.label.toLowerCase().replace(/\s+/g, '-')}-nav`}
              onClick={onMobileClose}
              title={t(labelKey) || item.label}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-surface-hover-dark hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="w-6 h-6 flex items-center justify-center">
                <span className={`material-symbols-outlined text-[22px] transition-transform duration-200 group-hover:scale-110 ${isActive ? 'fill-1' : ''}`}>
                  {item.icon}
                </span>
              </div>
              <span className="text-sm">{t(labelKey) || item.label}</span>
            </Link>
          );
        })}
      </div>
    );
  };

  return (
    <aside className="w-full lg:w-64 bg-white dark:bg-background-dark border-r border-slate-200 dark:border-border-dark h-full lg:h-screen lg:sticky top-0 flex flex-col transition-colors duration-300">
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
            <span className="material-symbols-outlined fill-1">potted_plant</span>
          </div>
          <h1 className="font-bold text-xl tracking-tight dark:text-white">AgriTech Pro</h1>
        </div>
        {onMobileClose && (
          <button 
            onClick={onMobileClose}
            className="lg:hidden w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white"
            title={t('close_menu')}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
      </div>

      <nav className="flex-1 px-4 py-4 space-y-6 overflow-y-auto">
        {renderNavItems(SIDEBAR_NAV, 'main_menu')}
        {renderNavItems(MARKETPLACE_NAV, 'marketplace_title')}
      </nav>

      <div className="p-4 border-t border-slate-100 dark:border-border-dark">
        <div className="bg-slate-50 dark:bg-muted-dark rounded-2xl p-4 transition-colors">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t('pro_plan')}</p>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">{t('upgrade_msg')}</p>
          <button className="w-full bg-primary text-white py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
            {t('upgrade_now')}
          </button>
        </div>
      </div>
    </aside>
  );
}

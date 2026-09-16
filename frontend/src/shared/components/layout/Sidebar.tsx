import {
   Award,
   BarChart3,
   BookOpen,
   Calendar,
   ClipboardList,
   FileText,
   GraduationCap,
   LayoutDashboard,
   Notebook,
   School,
   UserCog,
   Users,
   type LucideIcon,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { ROUTES, USER_ROLES, type UserRole } from "@/constants/app.constants";
import { Tooltip } from "@/shared/components/ui";
import { cn } from "@/shared/utils/cn";

interface NavItem {
   label: string;
   to: string;
   icon: LucideIcon;
   end?: boolean;
}

interface NavSection {
   label?: string;
   items: NavItem[];
}

function getNavSections(role: UserRole): NavSection[] {
   switch (role) {
      case USER_ROLES.SCHOOL_ADMIN:
         return [
            {
               items: [
                  { label: "Dashboard", to: ROUTES.ADMIN_DASHBOARD, icon: LayoutDashboard, end: true },
               ],
            },
            {
               label: "People",
               items: [
                  { label: "Students", to: ROUTES.ADMIN_STUDENTS, icon: Users },
                  { label: "Teachers", to: ROUTES.ADMIN_TEACHERS, icon: UserCog },
               ],
            },
            {
               label: "Academics",
               items: [
                  { label: "Classes", to: ROUTES.ADMIN_CLASSES, icon: School },
                  { label: "Subjects", to: ROUTES.ADMIN_SUBJECTS, icon: BookOpen },
                  { label: "Academic Years", to: ROUTES.ADMIN_ACADEMIC_YEARS, icon: Calendar },
                  { label: "Grade Bands", to: ROUTES.ADMIN_GRADE_BANDS, icon: Award },
               ],
            },
            {
               label: "Assessment",
               items: [
                  { label: "Mark Sheets", to: ROUTES.ADMIN_MARKSHEETS, icon: ClipboardList },
                  { label: "Reports", to: ROUTES.ADMIN_REPORTS, icon: BarChart3 },
               ],
            },
         ];
      case USER_ROLES.TEACHER:
         return [
            {
               items: [
                  { label: "Dashboard", to: ROUTES.TEACHER_DASHBOARD, icon: LayoutDashboard, end: true },
                  { label: "My Classes", to: ROUTES.TEACHER_CLASSES, icon: School },
                  { label: "My Students", to: ROUTES.TEACHER_STUDENTS, icon: Users },
                  { label: "Gradebook", to: ROUTES.TEACHER_GRADEBOOK, icon: Notebook },
                  { label: "Mark Sheets", to: ROUTES.TEACHER_MARKSHEETS, icon: ClipboardList },
               ],
            },
         ];
      case USER_ROLES.STUDENT:
         return [
            {
               items: [
                  { label: "Dashboard", to: ROUTES.STUDENT_DASHBOARD, icon: LayoutDashboard, end: true },
                  { label: "My Marks", to: ROUTES.STUDENT_MARKS, icon: Award },
                  { label: "My Subjects", to: ROUTES.STUDENT_SUBJECTS, icon: BookOpen },
                  { label: "Report Card", to: ROUTES.STUDENT_REPORT, icon: FileText },
               ],
            },
         ];
      default:
         return [];
   }
}

export interface SidebarProps {
   role: UserRole;
   collapsed?: boolean;
   onNavigate?: () => void;
   /** Hide the brand row — used inside the mobile Drawer, which already shows its own title. */
   showBrand?: boolean;
}

/** Nav content shared by the persistent desktop aside and the mobile drawer. */
export function Sidebar({ role, collapsed = false, onNavigate, showBrand = true }: SidebarProps) {
   const sections = getNavSections(role);

   return (
      <nav className="flex h-full flex-col gap-6 overflow-y-auto px-3 py-4" aria-label="Main navigation">
         {showBrand && (
            <div className={cn("flex items-center gap-2 px-2", collapsed && "justify-center")}>
               <GraduationCap className="h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
               {!collapsed && (
                  <span className="truncate text-sm font-semibold text-text-primary">
                     SMS
                  </span>
               )}
            </div>
         )}

         {sections.map((section, i) => (
            <div key={section.label ?? i} className="flex flex-col gap-2">
               {section.label && !collapsed && (
                  <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
                     {section.label}
                  </p>
               )}
               {section.items.map((item) => {
                  const link = (
                     <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        onClick={onNavigate}
                        className={({ isActive }) =>
                           cn(
                              "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors duration-(--transition-fast)",
                              collapsed && "justify-center px-0",
                              isActive
                                 ? "bg-primary-subtle text-primary-700"
                                 : "text-text-secondary hover:bg-bg-subtle hover:text-text-primary",
                           )
                        }
                     >
                        <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                     </NavLink>
                  );
                  return collapsed ? (
                     <Tooltip key={item.to} content={item.label} side="right">
                        {link}
                     </Tooltip>
                  ) : (
                     link
                  );
               })}
            </div>
         ))}
      </nav>
   );
}

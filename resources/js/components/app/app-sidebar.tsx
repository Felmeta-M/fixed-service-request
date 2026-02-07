import { NavUser } from '@/components/nav/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { Link, usePage } from '@inertiajs/react';
import { CheckCircle, MapPin } from 'lucide-react';
import { LogoSwitcher } from './logo-switcher';

// Custom Services icon: hand holding globe (from Figma)
function ServicesIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 18 19" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path
                d="M11.18 6C11.22 5.67 11.25 5.34 11.25 5C11.25 4.66 11.22 4.33 11.18 4H12.87C12.95 4.32 13 4.655 13 5C13 5.345 12.95 5.68 12.87 6M10.295 8.78C10.595 8.225 10.825 7.625 10.985 7H12.46C11.9756 7.83414 11.2071 8.466 10.295 8.78ZM10.17 6H7.83C7.78 5.67 7.75 5.34 7.75 5C7.75 4.66 7.78 4.325 7.83 4H10.17C10.215 4.325 10.25 4.66 10.25 5C10.25 5.34 10.215 5.67 10.17 6ZM9 8.98C8.585 8.38 8.25 7.715 8.045 7H9.955C9.75 7.715 9.415 8.38 9 8.98ZM7 3H5.54C6.01932 2.16352 6.78733 1.53062 7.7 1.22C7.4 1.775 7.175 2.375 7 3ZM5.54 7H7C7.175 7.625 7.4 8.225 7.7 8.78C6.78913 8.46615 6.02214 7.8341 5.54 7ZM5.13 6C5.05 5.68 5 5.345 5 5C5 4.655 5.05 4.32 5.13 4H6.82C6.78 4.33 6.75 4.66 6.75 5C6.75 5.34 6.78 5.67 6.82 6M9 1.015C9.415 1.615 9.75 2.285 9.955 3H8.045C8.25 2.285 8.585 1.615 9 1.015ZM12.46 3H10.985C10.8283 2.38081 10.5966 1.78305 10.295 1.22C11.215 1.535 11.98 2.17 12.46 3ZM9 0C6.235 0 4 2.25 4 5C4 6.32608 4.52678 7.59785 5.46447 8.53553C5.92876 8.99983 6.47995 9.36812 7.08658 9.6194C7.69321 9.87067 8.34339 10 9 10C10.3261 10 11.5979 9.47322 12.5355 8.53553C13.4732 7.59785 14 6.32608 14 5C14 4.34339 13.8707 3.69321 13.6194 3.08658C13.3681 2.47995 12.9998 1.92876 12.5355 1.46447C12.0712 1.00017 11.52 0.631876 10.9134 0.380602C10.3068 0.129329 9.65661 0 9 0Z"
                fill="currentColor"
            />
            <path
                d="M0 18H2V12H0V18ZM9.46 19L6.53 18.36L3.6 17.67C3.43041 17.6369 3.27805 17.5448 3.17 17.41C3.05743 17.2795 2.9969 17.1122 3 16.94V12.94C3.00283 12.7687 3.06265 12.6034 3.17 12.47C3.28169 12.3394 3.43246 12.2482 3.6 12.21L8.38 11.62L13.17 11.02L13.32 11.58L13.47 12.13C13.4727 12.3143 13.4204 12.4953 13.32 12.65C13.2281 12.8117 13.0884 12.9409 12.92 13.02L10.92 13.52L8.92 14.02L10.54 14.68L12.17 15.33L14.44 14.69L16.65 14C16.8464 13.9503 17.0544 13.979 17.23 14.08C17.3184 14.1277 17.3961 14.1932 17.458 14.2724C17.52 14.3515 17.5649 14.4426 17.59 14.54L17.78 15.31L17.98 16.07C18.0254 16.26 17.9968 16.4602 17.9 16.63C17.7971 16.8012 17.6325 16.9265 17.44 16.98L13.81 17.98L10.18 18.98C10.0605 18.9954 9.9395 18.9954 9.82 18.98C9.70192 19.0064 9.58028 19.0131 9.46 19Z"
                fill="currentColor"
            />
        </svg>
    );
}

// Custom Complaints icon: speech bubble with pencil (from Figma) - exported for guest-layout & header
export function ComplaintsIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 20 19" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path
                d="M5 12H6.65C6.78333 12 6.91267 11.975 7.038 11.925C7.16333 11.875 7.27567 11.8 7.375 11.7L12.05 7C12.2 6.85 12.3127 6.679 12.388 6.487C12.4633 6.295 12.5007 6.10767 12.5 5.925C12.4993 5.74233 12.462 5.56333 12.388 5.388C12.314 5.21267 12.2097 5.05 12.075 4.9L11.15 3.95C11 3.8 10.8333 3.68767 10.65 3.613C10.4667 3.53833 10.275 3.50067 10.075 3.5C9.89167 3.5 9.70833 3.53767 9.525 3.613C9.34167 3.68833 9.175 3.80067 9.025 3.95L4.3 8.625C4.2 8.725 4.125 8.83767 4.075 8.963C4.025 9.08833 4 9.21733 4 9.35V11C4 11.2833 4.096 11.521 4.288 11.713C4.48 11.905 4.71733 12.0007 5 12ZM10.05 6.9L9.1 5.975L10.075 5L11 5.95L10.05 6.9ZM9.2 12H15C15.2833 12 15.521 11.904 15.713 11.712C15.905 11.52 16.0007 11.2827 16 11C15.9993 10.7173 15.9033 10.48 15.712 10.288C15.5207 10.096 15.2833 10 15 10H11.2L9.2 12ZM4 16L1.7 18.3C1.38334 18.6167 1.02067 18.6877 0.612002 18.513C0.203335 18.3383 -0.000665038 18.0257 1.62866e-06 17.575V2C1.62866e-06 1.45 0.196002 0.979333 0.588002 0.588C0.980002 0.196667 1.45067 0.000666667 2 0H18C18.55 0 19.021 0.196 19.413 0.588C19.805 0.98 20.0007 1.45067 20 2V14C20 14.55 19.8043 15.021 19.413 15.413C19.0217 15.805 18.5507 16.0007 18 16H4Z"
                fill="currentColor"
            />
        </svg>
    );
}

// Step icons from Figma (use currentColor so step state controls color) - exported for main-layout
export function StepServiceIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 18 19" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path
                d="M11.18 6C11.22 5.67 11.25 5.34 11.25 5C11.25 4.66 11.22 4.33 11.18 4H12.87C12.95 4.32 13 4.655 13 5C13 5.345 12.95 5.68 12.87 6M10.295 8.78C10.595 8.225 10.825 7.625 10.985 7H12.46C11.9756 7.83414 11.2071 8.466 10.295 8.78ZM10.17 6H7.83C7.78 5.67 7.75 5.34 7.75 5C7.75 4.66 7.78 4.325 7.83 4H10.17C10.215 4.325 10.25 4.66 10.25 5C10.25 5.34 10.215 5.67 10.17 6ZM9 8.98C8.585 8.38 8.25 7.715 8.045 7H9.955C9.75 7.715 9.415 8.38 9 8.98ZM7 3H5.54C6.01932 2.16352 6.78733 1.53062 7.7 1.22C7.4 1.775 7.175 2.375 7 3ZM5.54 7H7C7.175 7.625 7.4 8.225 7.7 8.78C6.78913 8.46615 6.02214 7.8341 5.54 7ZM5.13 6C5.05 5.68 5 5.345 5 5C5 4.655 5.05 4.32 5.13 4H6.82C6.78 4.33 6.75 4.66 6.75 5C6.75 5.34 6.78 5.67 6.82 6M9 1.015C9.415 1.615 9.75 2.285 9.955 3H8.045C8.25 2.285 8.585 1.615 9 1.015ZM12.46 3H10.985C10.8283 2.38081 10.5966 1.78305 10.295 1.22C11.215 1.535 11.98 2.17 12.46 3ZM9 0C6.235 0 4 2.25 4 5C4 6.32608 4.52678 7.59785 5.46447 8.53553C5.92876 8.99983 6.47995 9.36812 7.08658 9.6194C7.69321 9.87067 8.34339 10 9 10C10.3261 10 11.5979 9.47322 12.5355 8.53553C13.4732 7.59785 14 6.32608 14 5C14 4.34339 13.8707 3.69321 13.6194 3.08658C13.3681 2.47995 12.9998 1.92876 12.5355 1.46447C12.0712 1.00017 11.52 0.631876 10.9134 0.380602C10.3068 0.129329 9.65661 0 9 0Z"
                fill="currentColor"
            />
            <path
                d="M0 18H2V12H0V18ZM9.46 19L6.53 18.36L3.6 17.67C3.43041 17.6369 3.27805 17.5448 3.17 17.41C3.05743 17.2795 2.9969 17.1122 3 16.94V12.94C3.00283 12.7687 3.06265 12.6034 3.17 12.47C3.28169 12.3394 3.43246 12.2482 3.6 12.21L8.38 11.62L13.17 11.02L13.32 11.58L13.47 12.13C13.4727 12.3143 13.4204 12.4953 13.32 12.65C13.2281 12.8117 13.0884 12.9409 12.92 13.02L10.92 13.52L8.92 14.02L10.54 14.68L12.17 15.33L14.44 14.69L16.65 14C16.8464 13.9503 17.0544 13.979 17.23 14.08C17.3184 14.1277 17.3961 14.1932 17.458 14.2724C17.52 14.3515 17.5649 14.4426 17.59 14.54L17.78 15.31L17.98 16.07C18.0254 16.26 17.9968 16.4602 17.9 16.63C17.7971 16.8012 17.6325 16.9265 17.44 16.98L13.81 17.98L10.18 18.98C10.0605 18.9954 9.9395 18.9954 9.82 18.98C9.70192 19.0064 9.58028 19.0131 9.46 19Z"
                fill="currentColor"
            />
        </svg>
    );
}

export function StepDeviceIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 22 21" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <g clipPath="url(#clip0_step_device)">
                <path
                    d="M22.0002 2.77283V2.91555L19.1808 11.7641C20.6566 11.8049 21.8373 12.9007 21.9594 14.3738C21.9594 14.4095 21.9798 14.4299 22.0002 14.4248V14.4706C22.0002 14.4706 21.9544 14.4859 21.9544 14.5216V17.1976C21.9544 17.2333 21.9849 17.2537 22.0002 17.2486V17.3913C22.0002 17.3913 21.9544 17.4321 21.9442 17.4779C21.7457 18.9867 20.4378 20.0571 18.8907 19.9398C18.9874 20.4801 18.6974 20.8726 18.2139 20.9847H17.9849C17.5625 20.8165 17.2877 20.475 17.3742 19.9449H4.59557C4.677 20.4597 4.40728 20.8522 3.93909 20.9847H3.66937C3.24697 20.8012 2.98234 20.4495 3.07903 19.9398C1.46071 20.0571 0.112113 18.8898 0.0052432 17.2944L0.0357776 14.277C0.0510447 12.8396 1.35893 11.8049 2.77878 11.759L0.0306885 3.01239C-0.106716 2.58423 0.203716 2.17137 0.585396 2.07962C0.967075 1.98788 1.36402 2.18666 1.50143 2.59443L4.3971 11.7743H17.5727L20.4785 2.55875C20.6108 2.22234 20.9162 2.03885 21.2521 2.05414C21.5523 2.06943 21.8373 2.27841 21.9289 2.59953C21.9493 2.67089 21.9391 2.74224 22.0002 2.77283ZM12.7737 16.326V15.3321C12.7686 14.8937 12.392 14.5675 11.9747 14.5828C11.5574 14.5981 11.2419 14.9396 11.2419 15.3779V16.3871C11.2419 16.8204 11.6236 17.1415 12.0205 17.1364C12.448 17.1262 12.7788 16.7847 12.7788 16.3209L12.7737 16.326ZM15.8373 16.326V15.3321C15.8322 14.8886 15.4556 14.5675 15.0383 14.5828C14.621 14.5981 14.3055 14.9396 14.3055 15.3779V16.3871C14.3055 16.8204 14.6872 17.1415 15.0841 17.1364C15.5116 17.1262 15.8424 16.7847 15.8424 16.3209L15.8373 16.326ZM18.9009 16.326V15.3321C18.8958 14.8886 18.5192 14.5675 18.1019 14.5828C17.6846 14.5981 17.3691 14.9396 17.3691 15.3779V16.3871C17.3691 16.8204 17.7508 17.1415 18.1477 17.1364C18.5752 17.1262 18.906 16.7847 18.906 16.3209L18.9009 16.326Z"
                    fill="currentColor"
                />
                <path
                    d="M15.588 3.47112C13.0537 0.902184 8.91626 0.907281 6.39209 3.47112C6.10202 3.76675 5.59311 3.71578 5.32848 3.43544C5.0384 3.12961 5.0384 2.66578 5.34375 2.35485C6.74324 0.937864 8.59565 0.137621 10.5702 0.0152913C10.8654 -0.00509709 11.1096 -0.00509709 11.4048 0.0152913C13.3997 0.142718 15.2776 0.953155 16.672 2.40582C16.9519 2.70146 16.9061 3.16019 16.6465 3.43544C16.387 3.71068 15.8985 3.78714 15.588 3.47621V3.47112Z"
                    fill="currentColor"
                />
                <path
                    d="M12.9974 5.99926C11.8625 4.883 10.1017 4.88809 8.97701 5.99416C8.67167 6.29489 8.20347 6.29489 7.90831 6.01455C7.61314 5.73421 7.57243 5.23979 7.86759 4.93906C9.57752 3.19076 12.3867 3.19076 14.0966 4.93906C14.3867 5.23469 14.3561 5.70872 14.0813 5.99416C13.8065 6.2796 13.3231 6.32037 12.9974 5.99926Z"
                    fill="currentColor"
                />
                <path
                    d="M10.6974 7.31433C11.2673 7.14612 11.8119 7.48253 11.9645 7.99734C12.1274 8.54273 11.8169 9.1136 11.2775 9.27161C10.7381 9.42962 10.1935 9.13909 10.0205 8.61409C9.84748 8.08909 10.1121 7.48253 10.6974 7.31433Z"
                    fill="currentColor"
                />
            </g>
            <defs>
                <clipPath id="clip0_step_device">
                    <rect width="22" height="21" fill="white" />
                </clipPath>
            </defs>
        </svg>
    );
}

export function StepReviewIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 20 19" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path
                d="M5 12H6.65C6.78333 12 6.91267 11.975 7.038 11.925C7.16333 11.875 7.27567 11.8 7.375 11.7L12.05 7C12.2 6.85 12.3127 6.679 12.388 6.487C12.4633 6.295 12.5007 6.10767 12.5 5.925C12.4993 5.74233 12.462 5.56333 12.388 5.388C12.314 5.21267 12.2097 5.05 12.075 4.9L11.15 3.95C11 3.8 10.8333 3.68767 10.65 3.613C10.4667 3.53833 10.275 3.50067 10.075 3.5C9.89167 3.5 9.70833 3.53767 9.525 3.613C9.34167 3.68833 9.175 3.80067 9.025 3.95L4.3 8.625C4.2 8.725 4.125 8.83767 4.075 8.963C4.025 9.08833 4 9.21733 4 9.35V11C4 11.2833 4.096 11.521 4.288 11.713C4.48 11.905 4.71733 12.0007 5 12ZM10.05 6.9L9.1 5.975L10.075 5L11 5.95L10.05 6.9ZM9.2 12H15C15.2833 12 15.521 11.904 15.713 11.712C15.905 11.52 16.0007 11.2827 16 11C15.9993 10.7173 15.9033 10.48 15.712 10.288C15.5207 10.096 15.2833 10 15 10H11.2L9.2 12ZM4 16L1.7 18.3C1.38334 18.6167 1.02067 18.6877 0.612002 18.513C0.203335 18.3383 -0.000665038 18.0257 1.62866e-06 17.575V2C1.62866e-06 1.45 0.196002 0.979333 0.588002 0.588C0.980002 0.196667 1.45067 0.000666667 2 0H18C18.55 0 19.021 0.196 19.413 0.588C19.805 0.98 20.0007 1.45067 20 2V14C20 14.55 19.8043 15.021 19.413 15.413C19.0217 15.805 18.5507 16.0007 18 16H4Z"
                fill="currentColor"
            />
        </svg>
    );
}

export function StepPaymentIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path
                d="M3.575 0C2.62685 0 1.71754 0.391325 1.04709 1.08789C0.376651 1.78445 0 2.7292 0 3.71429V5.14286H22V3.71429C22 3.22652 21.9075 2.74353 21.7279 2.29289C21.5482 1.84225 21.2849 1.43279 20.9529 1.08789C20.6209 0.742986 20.2268 0.469394 19.7931 0.282733C19.3594 0.0960731 18.8945 0 18.425 0H3.575ZM22 6.85714H0V12.2857C0 13.2708 0.376651 14.2155 1.04709 14.9121C1.71754 15.6087 2.62685 16 3.575 16H18.425C18.8945 16 19.3594 15.9039 19.7931 15.7173C20.2268 15.5306 20.6209 15.257 20.9529 14.9121C21.2849 14.5672 21.5482 14.1577 21.7279 13.7071C21.9075 13.2565 22 12.7735 22 12.2857V6.85714ZM15.125 10.8571H17.875C18.0938 10.8571 18.3036 10.9474 18.4584 11.1082C18.6131 11.2689 18.7 11.487 18.7 11.7143C18.7 11.9416 18.6131 12.1596 18.4584 12.3204C18.3036 12.4811 18.0938 12.5714 17.875 12.5714H15.125C14.9062 12.5714 14.6964 12.4811 14.5416 12.3204C14.3869 12.1596 14.3 11.9416 14.3 11.7143C14.3 11.487 14.3869 11.2689 14.5416 11.1082C14.6964 10.9474 14.9062 10.8571 15.125 10.8571Z"
                fill="currentColor"
            />
        </svg>
    );
}

export function StepCustomerIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 23 19" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path
                d="M22.6131 16.5464C22.1712 16.1141 16.8159 14.0563 15.8441 13.6681C14.8775 13.2867 14.4918 12.2298 14.4918 12.2298C14.4918 12.2298 14.0567 12.4688 14.0567 11.7976C14.0567 11.1255 14.4918 12.2298 14.927 9.63804C14.927 9.63804 16.1342 9.30157 15.8944 6.51909H15.6044C15.6044 6.51909 16.3296 3.54421 15.6044 2.53733C14.8766 1.53045 14.5917 0.859197 12.9937 0.377793C11.3982 -0.102763 11.9784 -0.00699104 10.8198 0.0421664C9.65949 0.0904764 8.6937 0.714267 8.6937 1.04905C8.6937 1.04905 7.96851 1.09736 7.68014 1.38552C7.39006 1.67369 6.90717 3.01619 6.90717 3.35182C6.90717 3.68745 7.14862 5.9453 7.39006 6.42332L7.10254 6.51654C6.8611 9.29987 8.06833 9.6372 8.06833 9.6372C8.50345 12.229 8.93856 11.1246 8.93856 11.7967C8.93856 12.468 8.50345 12.229 8.50345 12.229C8.50345 12.229 8.11696 13.285 7.15118 13.6673C6.18539 14.0512 0.824078 16.1141 0.388109 16.5455C-0.0470074 16.9862 0.00162311 19 0.00162311 19H10.2704L11.0194 16.0675L10.354 15.4064L11.4998 14.2665L12.6456 15.4056L11.9801 16.0667L12.7292 18.9992H22.9979C22.9979 18.9992 23.0517 16.9837 22.6114 16.5438L22.6131 16.5464Z"
                fill="currentColor"
            />
        </svg>
    );
}

interface AppSidebarProps {
    currentStep?: number;
    mode?: 'list' | 'create';
    steps?: Array<{ name: string; icon: any }>;
    props?: React.ComponentProps<typeof Sidebar>;
}

export function AppSidebar({ currentStep = 0, mode = 'list', steps, ...props }: AppSidebarProps) {
    const { url } = usePage();
    const { t } = useTranslation();
    const { state } = useSidebar();

    const items = [
        {
            title: t('nav.services'),
            url: '/services',
            icon: ServicesIcon,
        },
        {
            title: t('nav.complaints'),
            url: '/complaints',
            icon: ComplaintsIcon,
        },
    ];

    const defaultCreateServiceSteps = [
        { name: t('sidebar.steps.service_info'), icon: StepServiceIcon },
        { name: t('sidebar.steps.location_info'), icon: MapPin },
        { name: t('sidebar.steps.device_info'), icon: StepDeviceIcon },
        { name: t('sidebar.steps.review_submit'), icon: StepReviewIcon },
        { name: t('sidebar.steps.payment'), icon: StepPaymentIcon },
    ];

    const actualSteps = steps || defaultCreateServiceSteps;

    const getStepDescription = (stepName: string) => {
        if (stepName === t('sidebar.steps.customer_info') || stepName === 'Customer Information')
            return t('sidebar.steps.customer_info_desc') || 'Create or confirm your profile';
        if (stepName === t('sidebar.steps.service_info') || stepName === 'Service Information')
            return t('sidebar.steps.service_info_desc') || 'Choose service configuration';
        if (stepName === t('sidebar.steps.location_info') || stepName === 'Location Information')
            return t('sidebar.steps.location_info_desc') || 'Select and check availability';
        if (stepName === t('sidebar.steps.device_info') || stepName === 'Device Information')
            return t('sidebar.steps.device_info_desc') || 'Choose your device option';
        if (stepName === t('sidebar.steps.review_submit') || stepName === 'Review & Submit')
            return t('sidebar.steps.review_submit_desc') || 'Verify details and submit request';
        if (stepName === t('sidebar.steps.payment') || stepName === 'Payment / Subscribe')
            return t('sidebar.steps.payment_desc') || 'Review charges and proceed';
        return '';
    };

    const isCurrentPath = (itemUrl: string) => {
        return url === itemUrl;
    };

    const displayMode = mode === 'create' || url.startsWith('/services/create') ? 'create' : 'list';

    return (
        <Sidebar collapsible="icon" className="h-screen" {...props}>
            <SidebarHeader className={cn('mb-2 rounded-br-xl border-r-2 border-b-2 border-primary py-4', state !== 'collapsed' && 'mr-2')}>
                <LogoSwitcher />
            </SidebarHeader>
            <SidebarContent className={cn('rounded-tr-xl border-t-2 border-r-2 border-primary', state !== 'collapsed' && 'mr-2')}>
                {displayMode === 'create' ? (
                    <SidebarGroup className="py-0">
                        <SidebarGroupContent>
                            {state === 'collapsed' ? (
                                <div className="flex flex-col items-center gap-3 py-4">
                                    {actualSteps.map((step, idx) => {
                                        const status = idx < currentStep ? 'complete' : idx === currentStep ? 'current' : 'upcoming';
                                        const isCompleted = status === 'complete';
                                        const isCurrent = status === 'current';
                                        const Icon = step.icon;

                                        return (
                                            <button
                                                key={step.name}
                                                type="button"
                                                aria-label={step.name}
                                                className={cn(
                                                    'flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-200 sm:h-12 sm:w-12',
                                                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                                                    isCompleted
                                                        ? 'border-primary bg-primary text-primary-foreground'
                                                        : isCurrent
                                                          ? 'border-primary text-primary'
                                                          : 'border-muted bg-background text-muted-foreground',
                                                )}
                                            >
                                                {isCompleted ? (
                                                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                                                ) : (
                                                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-4">
                                    {/* Step Counter Header */}
                                    <div className="mb-6 flex items-center justify-between border-b-2 border-primary px-2 pb-6">
                                        <span className="text-sm font-medium text-gray-600">Step</span>
                                        <span className="text-sm font-medium text-gray-800">
                                            {currentStep + 1} of {actualSteps.length}
                                        </span>
                                    </div>

                                    {/* Steps List */}
                                    <ol role="list" className="relative space-y-2">
                                        {actualSteps.map((step, idx) => {
                                            const status = idx < currentStep ? 'complete' : idx === currentStep ? 'current' : 'upcoming';
                                            const isCompleted = status === 'complete';
                                            const isCurrent = status === 'current';
                                            const Icon = step.icon;

                                            return (
                                                <li key={step.name} className="relative">
                                                    {/* Connecting line - positioned on the left */}
                                                    {idx < actualSteps.length - 1 && (
                                                        <div
                                                            className={cn(
                                                                'absolute top-[41px] left-[19px] h-[calc(100%-20px)] w-[2px] rounded-full',
                                                                isCompleted ? 'bg-primary' : 'bg-gray-200',
                                                            )}
                                                            aria-hidden="true"
                                                        />
                                                    )}

                                                    <div className="relative flex items-start gap-3 py-3">
                                                        {/* Step icon circle */}
                                                        <div
                                                            className={cn(
                                                                'z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-200',
                                                                isCompleted
                                                                    ? 'bg-primary text-white'
                                                                    : isCurrent
                                                                      ? 'border-2 border-primary bg-white text-primary'
                                                                      : 'bg-gray-100 text-gray-400',
                                                            )}
                                                        >
                                                            {isCompleted ? (
                                                                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                                                            ) : (
                                                                <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                                                            )}
                                                        </div>

                                                        {/* Step content */}
                                                        <div className="flex min-w-0 flex-1 flex-col pt-0.5">
                                                            <span
                                                                className={cn(
                                                                    'text-sm leading-tight font-medium',
                                                                    isCompleted ? 'text-primary' : isCurrent ? 'text-gray-900' : 'text-gray-400',
                                                                )}
                                                            >
                                                                {step.name}
                                                            </span>
                                                            <span
                                                                className={cn(
                                                                    'mt-0.5 text-xs leading-tight',
                                                                    isCompleted ? 'text-primary/70' : isCurrent ? 'text-gray-500' : 'text-gray-400',
                                                                )}
                                                            >
                                                                {getStepDescription(step.name)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ol>
                                </div>
                            )}
                        </SidebarGroupContent>
                    </SidebarGroup>
                ) : (
                    <SidebarGroup>
                        <SidebarGroupContent>
                            <SidebarMenu className="gap-0">
                                {items.map((item) => {
                                    const isActive = url.startsWith(item.url);
                                    return (
                                        <SidebarMenuItem key={item.title} className="relative">
                                            <SidebarMenuButton
                                                asChild
                                                isActive={isActive}
                                                tooltip={item.title}
                                                className={cn(
                                                    'flex items-center gap-3 px-0 py-6 transition-colors sm:px-0 sm:py-8',
                                                    isActive ? 'bg-transparent' : 'hover:bg-gray-50',
                                                )}
                                            >
                                                <Link href={item.url}>
                                                    <div
                                                        className={cn(
                                                            'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all sm:h-10 sm:w-10',
                                                            isActive ? 'border-primary text-primary' : 'border-gray-300 bg-white text-gray-400',
                                                        )}
                                                    >
                                                        <item.icon className="h-5 w-5" />
                                                    </div>
                                                    <span className={cn('text-sm font-semibold', isActive ? 'text-gray-900' : 'text-gray-400')}>
                                                        {item.title}
                                                    </span>
                                                </Link>
                                            </SidebarMenuButton>
                                            {/* Green line below when active */}
                                            {isActive && <div className="absolute right-0 bottom-0 left-0 h-0.5 bg-primary" />}
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
                {/* {state !== 'collapsed' && (
                    <div className="flex justify-end py-2">
                        <SidebarTrigger className="h-8 w-8 shrink-0" />
                    </div>
                )}
                {state === 'collapsed' && (
                    <div className="flex justify-end">
                        <SidebarTrigger className="h-8 w-8 shrink-0 py-2" />
                    </div>
                )} */}
            </SidebarContent>
            <SidebarFooter className={cn('border-t-2 border-r-2 border-t-gray-300 border-r-primary p-0', state !== 'collapsed' && 'mr-2')}>
                <div className={cn('flex', state === 'collapsed' ? 'justify-center' : 'justify-start px-2')}></div>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

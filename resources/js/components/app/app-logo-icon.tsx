import { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 40 42" xmlns="http://www.w3.org/2000/svg">
            <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="48"
                fontFamily="Arial, Helvetica, sans-serif"
                fontWeight="bold"
                fill="currentColor"
            >
                e
            </text>
        </svg>
    );
}

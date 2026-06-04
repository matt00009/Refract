import { type SVGProps } from 'react';

export function SparklesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="M5 3v4"/>
      <path d="M19 17v4"/>
      <path d="M3 5h4"/>
      <path d="M17 19h4"/>
    </svg>
  );
}

export function AnthropicIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" {...props}>
      <path fill="currentColor" d="M371.498 333.151h-23.77c-7.618 0-14.735-4.14-18.497-10.755l-71.189-125.132l-71.306 125.132c-3.763 6.615-10.879 10.755-18.496 10.755h-24.116c-4.484 0-7.391-4.707-5.263-8.528l105.795-189.771c5.969-10.713 21.055-10.713 27.025 0l105.08 189.771c2.128 3.821-.779 8.528-5.263 8.528" />
    </svg>
  );
}

export function GeminiIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
      <path fill="url(#gemini_grad)" d="M12 2L14.73 9.27L22 12L14.73 14.73L12 22L9.27 14.73L2 12L9.27 9.27L12 2Z"/>
      <defs>
        <linearGradient id="gemini_grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4285F4"/>
          <stop offset="0.5" stopColor="#9B72CB"/>
          <stop offset="1" stopColor="#D96570"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export function MistralIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2L22 7.77V16.23L12 22L2 16.23V7.77L12 2ZM12 4.31L4 8.93V15.07L12 19.69L20 15.07V8.93L12 4.31ZM12 12.31L7.5 9.7V11.5L12 14.12L16.5 11.5V9.7L12 12.31Z"/>
    </svg>
  );
}

export function GroqIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20ZM12 6L7 13H11V18L17 11H13V6H12Z"/>
    </svg>
  );
}

export function DeepSeekIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20ZM8 10C8 8.9 8.9 8 10 8H14C15.1 8 16 8.9 16 10V14C16 15.1 15.1 16 14 16H10C8.9 16 8 15.1 8 14V10ZM10 10V14H14V10H10Z"/>
    </svg>
  );
}

declare module '*.css' {
  const content: { [className: string]: string };
  export = content;
}

declare module '*.png';
declare module '*.gif';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.webp';
declare module '*.svg';

declare module '*?raw' {
  const content: string;
  export default content;
}

type PluginFormatTypes = 'WEBP' | 'PNG' | 'JPEG';

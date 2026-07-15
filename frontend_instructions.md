# Frontend Implementation Guide: Cinematic Glassmorphism UI

This document serves as the strict context and instruction file for AI agents to recreate or extend the Carverse frontend. The goal is to maintain an ultra-premium, highly reactive, and cinematic dashboard using React (Vite), Tailwind CSS v4, and Shadcn UI.

## 1. Core Architecture & Philosophy
- **Tech Stack:** React 19, Tailwind CSS v4, Shadcn UI, Convex Backend.
- **Design Language:** Dark mode, Glassmorphism, Neon accents (Electric Blue, Neon Red, Cyan), and high-framerate micro-animations.
- **Background Strategy:**
  - **Login Page (`Auth.tsx`):** A looping cinematic video background (`bg.mp4`) combined with animated glowing orbs.
  - **Inside Dashboard (`App.tsx`):** A dark cinematic car showroom silhouette (`showroom_bg.jpg`) combined with animated glowing orbs to emulate a high-end dealership vibe.

## 2. Global Glassmorphism System (Tailwind v4)
All application panels, cards, sidebars, and popovers must use true glassmorphism. This is achieved by globally injecting transparency and backdrop filters into the Shadcn UI semantic variables within `src/index.css`.

**Color Variables (index.css):**
```css
:root {
  /* Dark Slate Base */
  --background: oklch(0.13 0.01 260);
  
  /* Glassy Components (Note the / 0.65 opacity) */
  --card: oklch(0.18 0.01 260 / 0.65);
  --popover: oklch(0.15 0.01 260 / 0.65);
  --sidebar: oklch(0.11 0.01 260 / 0.65);
  
  /* Electric Blue Primary */
  --primary: oklch(0.65 0.25 260);
  --destructive: oklch(0.58 0.19 27); /* Neon Red */
}
```

**Global Glass Filter Enforcement:**
```css
@layer base {
  /* Apply glass blur to all panels that use semantic colors */
  .bg-card, .bg-popover, .bg-sidebar, .bg-background {
    backdrop-filter: blur(16px) saturate(1.2);
    -webkit-backdrop-filter: blur(16px) saturate(1.2);
  }
}
```

## 3. Cinematic Background Implementation

### A. Login Page (Auth.tsx)
The video is placed securely behind the content using `z-index`.
```tsx
<div className="min-h-screen flex flex-col relative overflow-hidden">
  {/* Background Video */}
  <video id="bg-video" autoPlay loop muted playsInline>
    <source src="/bg.mp4" type="video/mp4" />
  </video>
  <div className="bg-overlay"></div>

  {/* Dynamic Moving Elements (Neon Orbs) */}
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <div className="absolute top-[10%] left-[10%] w-[40vw] h-[40vw] bg-primary/20 rounded-full blur-[100px] animate-pulse"></div>
    <div className="absolute bottom-[10%] right-[10%] w-[30vw] h-[30vw] bg-destructive/20 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s', animationDuration: '4s' }}></div>
  </div>
  
  {/* Auth Card Content */}
</div>
```

### B. Inside Dashboard (App.tsx)
The dashboard uses the `showroom_bg.jpg` layered over a dark base to prevent distraction while maintaining the dealership aesthetic.
```tsx
<SidebarProvider>
  {/* Premium Cinematic Dashboard Background */}
  <div className="fixed inset-0 bg-[#080A0D] z-[-3]"></div>
  <div 
    className="fixed inset-0 z-[-2] bg-cover bg-center bg-no-repeat opacity-40 transition-opacity duration-1000"
    style={{ backgroundImage: 'url(/showroom_bg.jpg)' }}
  ></div>
  
  {/* Animated Neon Orbs */}
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1]">
    <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-primary/20 rounded-full blur-[100px] animate-pulse"></div>
    <div className="absolute bottom-[-10%] right-[10%] w-[50vw] h-[50vw] bg-destructive/15 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s', animationDuration: '6s' }}></div>
  </div>

  <div className="flex h-screen w-full overflow-hidden bg-transparent">
    <AppSidebar />
    <SidebarInset className="flex-1 overflow-hidden bg-transparent">
      {/* Content */}
    </SidebarInset>
  </div>
</SidebarProvider>
```

## 4. UI Elements & Micro-Animations
Buttons and interactive elements must feature neon glow effects and smooth transitions on hover to maintain a high-octane feel.
Example of the `default` button variant in `button.tsx`:
```tsx
default: "bg-primary/90 backdrop-blur-md border border-white/20 text-primary-foreground shadow-[0_4px_12px_rgba(0,0,0,0.5)] hover:bg-primary hover:border-primary/60 hover:shadow-[0_0_20px_var(--color-primary)] hover:-translate-y-1"
```

## 5. Agent Instructions for Implementation
When another AI agent is tasked with modifying or extending this UI, instruct them as follows:
1. **Preserve Transparency:** Never override `.bg-card` or `.bg-sidebar` with solid colors (no `bg-[#111]`). Always rely on the CSS variables which have the `/ 0.65` opacity built in so they refract the cinematic backgrounds.
2. **Component Upgrades:** If creating a new Widget, use `Card` from Shadcn. It will automatically inherit the glass blur effect.
3. **Animations:** Always include `transition-all duration-300 hover:-translate-y-1` on interactive elements, accompanied by a colored `shadow-[...]` for glowing hover states.

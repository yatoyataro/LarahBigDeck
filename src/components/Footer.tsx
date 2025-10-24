import { Heart, Github, ExternalLink } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-card/30 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-6">
          {/* Creator Info */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Created By</h3>
            <div className="space-y-2">
              <p className="text-sm sm:text-base font-medium">YatoYataro</p>
              <a
                href="https://github.com/yatoyataro"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-smooth group w-fit"
              >
                <Github className="h-4 w-4 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform" />
                <span>github.com/yatoyataro</span>
                <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
              </a>
              <p className="text-xs sm:text-sm text-muted-foreground mt-3">
                Full-stack developer passionate about creating useful tools for learning and productivity.
              </p>
            </div>
          </div>

          {/* About This Website */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">About LarahBigDeck</h3>
            <div className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <p>
                A modern flashcard study application designed to make learning efficient and enjoyable.
              </p>
              <p>
                Features include AI-powered card generation, multiple study modes, progress tracking, and smart spaced repetition.
              </p>
              <p className="pt-2">
                Built with React, TypeScript, Next.js, Supabase, and Google Gemini AI.
              </p>
            </div>
          </div>

          {/* Dedication */}
          <div className="md:col-span-2 lg:col-span-1">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
              <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 fill-red-500" />
              Dedicated To
            </h3>
            <div className="space-y-2">
              <p className="text-sm sm:text-base font-medium">Larah (xyzo)</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                This website was created specifically for my amazing sister, Larah, to help make her studying easier and more effective.
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-3">
                May this tool help you achieve all your learning goals! 📚✨
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            {/* Copyright */}
            <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
              © {new Date().getFullYear()} LarahBigDeck. Created with{" "}
              <Heart className="inline h-3 w-3 sm:h-4 sm:w-4 text-red-500 fill-red-500 mx-0.5" />{" "}
              by YatoYataro
            </p>

            {/* Quick Links */}
            <div className="flex items-center gap-4 sm:gap-6">
              <a
                href="https://github.com/yatoyataro/flash-flicker-deck"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-smooth flex items-center gap-1.5"
              >
                <Github className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Source Code</span>
              </a>
              <span className="text-xs sm:text-sm text-muted-foreground">
                v1.0.0
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

import { Link } from "react-router-dom";
import { Home, ArrowLeft, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUser, getDashboardRoute } from "@/lib/auth";

const NotFoundPage = () => {
  const user = getCurrentUser();
  const dashboardUrl = user ? getDashboardRoute(user.role as any) : "/";

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, rgba(240, 87, 34, 0.05), rgba(21, 189, 219, 0.05))' }}>
      <div className="max-w-2xl w-full text-center">
        {/* Animated Icon */}
        <div className="mb-8 relative">
          <div className="inline-block p-8 rounded-full animate-pulse" style={{ backgroundColor: 'rgba(240, 87, 34, 0.1)' }}>
            <AlertCircle className="h-24 w-24" style={{ color: 'var(--fundi-orange)' }} />
          </div>
          <div className="absolute top-0 right-1/4 animate-bounce">
            <Sparkles className="h-8 w-8" style={{ color: 'var(--fundi-yellow)' }} />
          </div>
        </div>

        {/* Error Code */}
        <div className="mb-6">
          <h1 className="heading-font text-9xl font-bold mb-2" style={{ 
            background: 'linear-gradient(135deg, var(--fundi-orange), var(--fundi-cyan))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            404
          </h1>
          <h2 className="heading-font text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--fundi-black)' }}>
            Page Not Found
          </h2>
          <p className="text-lg text-gray-600 mb-2">
            Oops! This page is still under construction.
          </p>
          <p className="text-gray-500">
            We're working hard to build amazing features for you!
          </p>
        </div>

        {/* Fun Message */}
        <div className="mb-8 p-6 rounded-lg border-2 border-dashed" style={{ borderColor: 'var(--fundi-orange)', backgroundColor: 'rgba(240, 87, 34, 0.05)' }}>
          <p className="text-sm md:text-base text-gray-700 italic">
            "Every great innovation starts with curiosity. This page is just waiting for its moment to shine!" ✨
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to={dashboardUrl}>
            <Button 
              size="lg"
              className="font-semibold shadow-lg hover:shadow-xl transition-all w-full sm:w-auto"
              style={{ backgroundColor: 'var(--fundi-orange)', color: 'white' }}
            >
              <Home className="h-5 w-5 mr-2" />
              Go to Dashboard
            </Button>
          </Link>

          <Button 
            variant="outline"
            size="lg"
            onClick={() => window.history.back()}
            className="font-semibold border-2 w-full sm:w-auto"
            style={{ borderColor: 'var(--fundi-cyan)', color: 'var(--fundi-cyan)' }}
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Go Back
          </Button>
        </div>

        {/* Footer Message */}
        <div className="mt-12 text-sm text-gray-500">
          <p>Need help? Contact your school administrator or teacher.</p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--fundi-orange)' }}></div>
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--fundi-cyan)' }}></div>
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--fundi-lime)' }}></div>
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--fundi-purple)' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;

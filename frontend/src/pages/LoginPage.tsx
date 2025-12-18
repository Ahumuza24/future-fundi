import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Sparkles, Loader2, AlertCircle } from "lucide-react";

const LoginPage = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await authApi.login(credentials);
      const { access, refresh, user } = response.data;

      // User data is now included in the token response
      if (!user) {
        throw new Error("User data not received");
      }

      login(access, refresh, user);
      
      // Redirect based on role
      const role = user.role || "learner";
      if (role === "learner") {
        navigate("/student");
      } else if (role === "parent") {
        navigate("/parent");
      } else if (role === "teacher") {
        navigate("/teacher");
      } else if (role === "leader" || role === "admin") {
        navigate("/leader");
      } else {
        navigate("/");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 
        err.response?.data?.message || 
        "Invalid username or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 dashboard-background">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="shadow-xl border-2">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div 
                  className="p-4 rounded-full"
                  style={{ backgroundColor: 'rgba(240, 87, 34, 0.1)' }}
                >
                  <Sparkles className="h-12 w-12" style={{ color: 'var(--fundi-orange)' }} />
                </div>
              </div>
              <CardTitle className="heading-font text-3xl font-bold" style={{ color: 'var(--fundi-black)' }}>
                Future Fundi
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Sign in to track your growth journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="text-sm text-red-600">{error}</span>
                  </div>
                )}

                <div>
                  <label htmlFor="username" className="block text-sm font-semibold mb-2">
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={credentials.username}
                    onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                    className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--fundi-orange)] transition-all"
                    placeholder="Enter your username"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--fundi-orange)] transition-all"
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full font-semibold text-lg py-6 shadow-md hover:shadow-lg transition-shadow"
                  style={{ 
                    backgroundColor: 'var(--fundi-orange)', 
                    color: 'white'
                  }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>

                <div className="text-center text-sm text-gray-600 pt-4">
                  <p>
                    Don't have an account?{" "}
                    <Link
                      to="/signup"
                      className="font-semibold hover:underline"
                      style={{ color: "var(--fundi-orange)" }}
                    >
                      Sign up
                    </Link>
                  </p>
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs">Demo credentials:</p>
                    <p className="mono-font mt-1 text-xs">username: <strong>admin</strong></p>
                    <p className="mono-font text-xs">password: <strong>password</strong></p>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;


import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

const SignUpPage = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    password_confirm: "",
    first_name: "",
    last_name: "",
    // school_code: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Client-side validation
    if (formData.password !== formData.password_confirm) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    try {
      const response = await authApi.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        password_confirm: formData.password_confirm,
        first_name: formData.first_name,
        last_name: formData.last_name,
        // school_code: formData.school_code || undefined,
      });

      const { access, refresh, user } = response.data;

      if (!user) {
        throw new Error("User data not received");
      }

      // Auto-login after registration
      login(access, refresh, user);
      setSuccess(true);

      // All new registrations are parents, redirect to parent portal
      setTimeout(() => {
        navigate("/parent");
      }, 1500);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        (err.response?.data && typeof err.response.data === "object"
          ? Object.values(err.response.data).flat().join(", ")
          : "Registration failed. Please try again.");
      setError(errorMessage);
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
                  className="p-2 rounded-full"
                >
                  <img
                    src="/fundi_bots_logo.png"
                    alt="Fundi Bots Logo"
                    className="h-16 w-auto object-contain"
                  />
                </div>
              </div>
              <CardTitle className="heading-font text-3xl font-bold" style={{ color: "var(--fundi-black)" }}>
                Create Parent Account
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Register to manage your children's learning journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              {success ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <CheckCircle2 className="h-16 w-16 mx-auto mb-4" style={{ color: "var(--fundi-lime)" }} />
                  <h3 className="text-xl font-bold mb-2" style={{ color: "var(--fundi-black)" }}>
                    Account Created!
                  </h3>
                  <p className="text-gray-600">Redirecting you to your dashboard...</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                      <span className="text-sm text-red-600">{error}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="first_name" className="block text-sm font-semibold mb-2">
                        First Name
                      </label>
                      <input
                        id="first_name"
                        name="first_name"
                        type="text"
                        value={formData.first_name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--fundi-orange)] transition-all"
                        placeholder="First name"
                        required
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label htmlFor="last_name" className="block text-sm font-semibold mb-2">
                        Last Name
                      </label>
                      <input
                        id="last_name"
                        name="last_name"
                        type="text"
                        value={formData.last_name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--fundi-orange)] transition-all"
                        placeholder="Last name"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="username" className="block text-sm font-semibold mb-2">
                      Username
                    </label>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      value={formData.username}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--fundi-orange)] transition-all"
                      placeholder="Choose a username"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold mb-2">
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--fundi-orange)] transition-all"
                      placeholder="your.email@example.com"
                      required
                      disabled={loading}
                    />
                  </div>

                  {/* <div>
                    <label htmlFor="school_code" className="block text-sm font-semibold mb-2">
                      School Code <span className="text-gray-500 text-xs">(Optional)</span>
                    </label>
                    <input
                      id="school_code"
                      name="school_code"
                      type="text"
                      value={formData.school_code}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--fundi-orange)] transition-all"
                      placeholder="Enter your school code"
                      disabled={loading}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Ask your teacher or administrator for your school code
                    </p>
                  </div>
 */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-semibold mb-2">
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--fundi-orange)] transition-all"
                      placeholder="At least 8 characters"
                      required
                      minLength={8}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label htmlFor="password_confirm" className="block text-sm font-semibold mb-2">
                      Confirm Password
                    </label>
                    <input
                      id="password_confirm"
                      name="password_confirm"
                      type="password"
                      value={formData.password_confirm}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--fundi-orange)] transition-all"
                      placeholder="Confirm your password"
                      required
                      minLength={8}
                      disabled={loading}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full font-semibold text-lg py-6 shadow-md hover:shadow-lg transition-shadow"
                    style={{
                      backgroundColor: "var(--fundi-orange)",
                      color: "white",
                    }}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>

                  <div className="text-center text-sm text-gray-600 pt-4">
                    <p>
                      Already have an account?{" "}
                      <Link
                        to="/login"
                        className="font-semibold hover:underline"
                        style={{ color: "var(--fundi-orange)" }}
                      >
                        Sign in
                      </Link>
                    </p>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default SignUpPage;


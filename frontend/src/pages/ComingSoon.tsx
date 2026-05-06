import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Construction, Home } from "lucide-react";
import { getCurrentUser, getDashboardRoute } from "@/lib/auth";

export default function ComingSoon() {
    const navigate = useNavigate();
    const user = getCurrentUser();
    const dashboardUrl = user ? getDashboardRoute(user.role) : "/";

    return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50">
            <Card className="max-w-md w-full text-center">
                <CardContent className="p-8">
                    <div className="bg-blue-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                        <Construction className="h-10 w-10 text-blue-600" />
                    </div>

                    <h1 className="heading-font text-2xl font-bold mb-2 text-fundi-black">
                        This feature is coming soon
                    </h1>

                    <p className="text-gray-600 mb-8">
                        We are still building this part of Future Fundi.
                    </p>

                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={() => navigate(-1)}
                            className="w-full bg-fundi-cyan"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Go Back
                        </Button>
                        <Button asChild variant="outline" className="w-full">
                            <Link to={dashboardUrl}>
                                <Home className="h-4 w-4 mr-2" />
                                Go to Dashboard
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

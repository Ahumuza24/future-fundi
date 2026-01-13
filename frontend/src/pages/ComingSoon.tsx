import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Construction, ArrowLeft } from "lucide-react";

export default function ComingSoon() {
    const navigate = useNavigate();

    return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50">
            <Card className="max-w-md w-full text-center">
                <CardContent className="p-8">
                    <div className="bg-blue-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                        <Construction className="h-10 w-10 text-blue-600" />
                    </div>

                    <h1 className="heading-font text-2xl font-bold mb-2" style={{ color: "var(--fundi-black)" }}>
                        Coming Soon!
                    </h1>

                    <p className="text-gray-600 mb-8">
                        This module is currently under development. Phase 2 features are being rolled out.
                    </p>

                    <Button
                        onClick={() => navigate(-1)}
                        className="w-full"
                        style={{ backgroundColor: "var(--fundi-cyan)" }}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Go Back
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

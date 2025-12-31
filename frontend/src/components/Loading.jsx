import { Loader2 } from 'lucide-react';

const Loading = ({ fullScreen = false }) => {
    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="flex flex-col items-center">
                    <div className="relative">
                        <div className="h-16 w-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-3 w-3 rounded-full bg-blue-600"></div>
                        </div>
                    </div>
                    <p className="mt-4 text-lg font-semibold text-gray-700 animate-pulse">Loading Smart Bus Admin...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] w-full bg-white rounded-xl shadow-sm border border-gray-100 m-8">
            <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-3" />
            <p className="text-gray-500 font-medium">Fetching data, please wait...</p>
        </div>
    );
};

export default Loading;

import LoadingAnimation from "@/components/loading-animation";

export default function Loading() {
    return (
        <div className="flex flex-col md:flex-row h-screen overflow-hidden">
            <LoadingAnimation />
        </div>
    );
}

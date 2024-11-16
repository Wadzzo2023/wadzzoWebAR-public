interface InfoBoxProps {
  title?: string;
  description?: string;
  brandName?: string;
  position?: { left: number; top: number };
}

export default function ArCard({
  title = "Item",
  description = "No description available",
  brandName = "Unknown Brand",
  position = { left: 0, top: 0 },
}: InfoBoxProps) {
  return (
    <>
      <div
        className="w-52 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
        style={{
          position: "absolute",
          left: `${position.left}px`,
          top: `${position.top}px`,
        }}
      >
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
            {title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            {description}
          </p>
          <span className="inline-block bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs font-semibold px-2 py-1 rounded-full">
            {brandName}
          </span>
        </div>
      </div>
    </>
  );
}

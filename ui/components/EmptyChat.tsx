import EmptyChatMessageInput from './EmptyChatMessageInput';

const EmptyChat = ({
  sendMessage,
  isAdvanceMode,
  setIsAdvanceMode,
}: {
  sendMessage: (message: string) => void;
  isAdvanceMode: boolean;
  setIsAdvanceMode: (enabled: boolean) => void;
}) => {
  return (
    <div className="relative">
      <div className="flex flex-col items-center justify-center min-h-screen max-w-screen-sm mx-auto p-2 space-y-8">
        <h2 className="text-black/70 dark:text-white/70 text-3xl font-medium -mt-8">
          Ask financial here.
        </h2>
        <EmptyChatMessageInput
          isAdvanceMode={isAdvanceMode}
          setIsAdvanceMode={setIsAdvanceMode}
          sendMessage={sendMessage}
        />
      </div>
    </div>
  );
};

export default EmptyChat;

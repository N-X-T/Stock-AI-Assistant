import { Button, Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import Markdown from 'markdown-to-jsx';
import { useState } from 'react'

interface info {
    isOpen: boolean;
    indName: string;
    content: string;
}

export default function SectorInfo({
    info,
    setInfo,
}: {
    info: info;
    setInfo: (info: info) => void;
}) {

    function close() {
        setInfo({
            isOpen: false,
            indName: "",
            content: ""
        })
    }

    return (
        <>
            <Dialog open={info.isOpen} as="div" className="relative z-50" onClose={close}>
                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <DialogPanel
                            transition
                            className="w-full max-w-screen-lg transform rounded-2xl bg-light-secondary dark:bg-dark-secondary border border-light-200 dark:border-dark-200 p-6 text-left align-middle shadow-xl transition-all"
                        >
                            <DialogTitle className="text-xl font-medium leading-6 dark:text-white mb-5">
                                Tình hình ngành {info.indName}
                            </DialogTitle>
                            <Markdown>{info.content}</Markdown>
                            <div className="mt-4">
                                <Button
                                    className="inline-flex items-center gap-2 rounded-md bg-gray-700 py-1.5 px-3 text-sm/6 font-semibold text-white shadow-inner shadow-white/10 focus:outline-none data-[hover]:bg-gray-600 data-[focus]:outline-1 data-[focus]:outline-white data-[open]:bg-gray-700"
                                    onClick={close}
                                >
                                    Đóng
                                </Button>
                            </div>
                        </DialogPanel>
                    </div>
                </div>
            </Dialog>
        </>
    )
}
"use client";
import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function TestFileUploadButton() {
    const [isMounted, setIsMounted] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<string | null>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const { getRootProps, getInputProps } = useDropzone({
        onDrop: (files) => {
            if (files[0]) setUploadedFile(files[0].name);
        },
        accept: { "text/csv": [".csv"] },
        multiple: false,
        // TOGGLE THIS LINE TO TEST HYPOTHESIS
        useFsAccessApi: true, // Set to true to reproduce failure, false to fix
    });

    if (!isMounted) return null;

    return (
        <>
            <Button
                variant="outline"
                onClick={() => setIsOpen(true)}
                data-testid="test-file-upload-button"
            >
                Test File Upload
            </Button>

            {isOpen && (
                <Dialog open={true} onOpenChange={(open) => !open && setIsOpen(false)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Test File Upload</DialogTitle>
                        </DialogHeader>

                        <div
                            {...getRootProps()}
                            data-testid="test-dropzone"
                            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer"
                        >
                            <input {...getInputProps()} />
                            {uploadedFile ? (
                                <p data-testid="uploaded-filename">{uploadedFile}</p>
                            ) : (
                                <p>Drop CSV here</p>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}

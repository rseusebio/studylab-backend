import { FileUpload } from "graphql-upload";

export default interface FileUploadArgs
{
    file: Promise<FileUpload>;
}
import { Editor } from "@tinymce/tinymce-react";

export default function PostEditor({ value, onChange }) {
  return (
    <Editor
      tinymceScriptSrc="/tinymce/tinymce.min.js"
      licenseKey="gpl"
      value={value}
      onEditorChange={onChange}
      init={{
        height: 600,
        menubar: true,
        automatic_uploads: true,
        paste_data_images: true,
        plugins: [
          "advlist", "autolink", "lists", "link", "image", "charmap",
          "preview", "anchor", "searchreplace", "visualblocks", "code",
          "fullscreen", "insertdatetime", "media", "table", "wordcount"
        ],
        toolbar:
          "undo redo | blocks fontfamily fontsize | " +
          "bold italic underline | forecolor backcolor | " +
          "alignleft aligncenter alignright alignjustify | " +
          "bullist numlist outdent indent | " +
          "link image media table | removeformat code preview",

        content_style: `
          body { font-family: Helvetica, Arial, sans-serif; font-size: 16px; }
          img { max-width: 100%; height: auto; }
        `,

        images_upload_handler: async (blobInfo, progress) => {
          const formData = new FormData();
          formData.append("file", blobInfo.blob(), blobInfo.filename());

          const response = await fetch("http://localhost:5000/api/media/upload", {
            method: "POST",
            body: formData,
            credentials: "include",
          });

          if (!response.ok) {
            throw new Error("Upload ảnh thất bại");
          }

          const data = await response.json();

          // TinyMCE chỉ cần URL ảnh.
          // Tao gắn thêm ?mid=<media_id> để backend parse lại lúc create post.
          return `${data.location}?mid=${data.media_id}`;
        },
      }}
    />
  );
}
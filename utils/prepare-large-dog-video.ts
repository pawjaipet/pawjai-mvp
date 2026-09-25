// Large phone videos get a short, muted upload copy. The original is unchanged.
export async function prepareLargeDogVideo(file: File, progress: (message: string) => void): Promise<File> {
  if (file.size <= 50 * 1024 * 1024) return file;
  if (file.size > 250 * 1024 * 1024) throw new Error(`${file.name}: over 250MB. Choose a shorter clip or record a short video of the dog. Other files will still be kept.`);
  const mime = ["video/mp4;codecs=avc1.42E01E", "video/mp4"].find((type) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type));
  if (!mime) throw new Error(`${file.name}: this browser cannot prepare large videos. Try an updated Chrome or Safari, or choose a shorter clip. Other files will still be kept.`);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  const url = URL.createObjectURL(file);
  const canvas = document.createElement("canvas");
  let recorder: MediaRecorder | undefined;
  let stream: MediaStream | undefined;
  let frame = 0;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  progress(`Preparing a short video from ${file.name}...`);
  try {
    return await new Promise<File>((resolve, reject) => {
      const fail = () => reject(new Error(`${file.name}: video preparation failed on this device. Choose a shorter clip. Other files will still be kept.`));
      timeout = setTimeout(fail, 45000);
      video.onerror = fail;
      video.onloadeddata = async () => {
        try {
          const scale = Math.min(1, 720 / Math.max(video.videoWidth, video.videoHeight));
          canvas.width = Math.max(2, Math.floor(video.videoWidth * scale / 2) * 2);
          canvas.height = Math.max(2, Math.floor(video.videoHeight * scale / 2) * 2);
          const context = canvas.getContext("2d");
          if (!context) return fail();
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          stream = canvas.captureStream(24);
          recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 1_200_000 });
          const chunks: Blob[] = [];
          recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
          recorder.onerror = fail;
          recorder.onstop = () => {
            const result = new File(chunks, file.name.replace(/\.[^.]+$/, "") + "-short.mp4", { type: "video/mp4" });
            if (!result.size || result.size > 50 * 1024 * 1024) return fail();
            resolve(result);
          };
          const duration = Math.min(Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 12, 12);
          const draw = () => {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            progress(`Preparing ${file.name}: ${Math.min(100, Math.round(video.currentTime / duration * 100))}%`);
            if (video.ended || video.currentTime >= duration) {
              if (recorder?.state === "recording") recorder.stop();
              video.pause();
            } else frame = requestAnimationFrame(draw);
          };
          recorder.start();
          await video.play();
          draw();
        } catch { fail(); }
      };
      video.src = url;
    });
  } finally {
    clearTimeout(timeout);
    cancelAnimationFrame(frame);
    video.pause();
    if (recorder && recorder.state !== "inactive") recorder.stop();
    stream?.getTracks().forEach((track) => track.stop());
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}

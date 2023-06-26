const { Storage } = require("@google-cloud/storage");
const { format } = require("util");

const storage = new Storage({
  projectId: "project-aarya-365411",
  keyFilename: "ProjectAaryaGCP.json",
});

const bucket = storage.bucket("project_aarya_bucket");



// create gcp bucket file stream
const createStreamfromGCP = (video) => {
  const blob = bucket.file(video);
  return blob.createReadStream();
};


const uploadFile = async (file) => {
  return new Promise((resolve, reject) => {
    try {
      const blob = bucket.file(file.originalname);
      const blobStream = blob.createWriteStream({
        resumable: false,
      });
  
      blobStream.on("error", (err) => {
        next(err);
      });
  
  
      blobStream.on("finish", () => {
        const publicUrl = encodeURI(format(
          `https://storage.googleapis.com/${bucket.name}/${blob.name}`
        ));
        // make public
        blob.makePublic().then(() => {
          resolve( {
            message: "File uploaded successfully",
            url: publicUrl,
            filename: file.originalname,
          });
        });
      });
      blobStream.end(file.buffer);
    } catch (err) {
      next(err);
    }
  });
};

const uploadMultipleFiles = async (files) => {
  try {
    let ResponseFromGCS = [];
    for (let i = 0; i < files.length; i++) {
      await uploadFile(files[i]).then((data) => {
        ResponseFromGCS.push(data);
      });
    }
    return ResponseFromGCS;
  } catch (err) {
    next(err);
  }
};

const getListFiles = async (req, res) => {
  try {
    const [files] = await bucket.getFiles();
    let fileInfos = [];

    files.forEach((file) => {
      fileInfos.push({
        name: file.name,
        url: file.metadata.mediaLink,
      });
    });

    res.status(200).send(fileInfos);
  } catch (err) {
    res.status(500).send({
      message: "Some error occurred while retrieving files.",
    });
  }
};

const downloadFile = async (req, res) => {
  try {
    const filename = req.params.name;
    const file = bucket.file(filename);
    const [exists] = await file.exists();
    if (!exists) {
      return res.status(404).send({
        message: "File not found!",
      });
    }
    const [metadata] = await file.getMetadata();
    res.set("Content-Type", metadata.contentType);
    res.set("Content-Disposition", `attachment; filename=${filename}`);
    file.createReadStream().pipe(res);
  } catch (err) {
    res.status(500).send({
      message: "Some error occurred while retrieving files.",
    });
  }
};

module.exports = {
  uploadFile,
  getListFiles,
  downloadFile,
  uploadMultipleFiles,
  createStreamfromGCP,
};

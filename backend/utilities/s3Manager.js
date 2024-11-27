const AWS = require('aws-sdk');

module.exports.generatePresignedUrl = async (req, res) => {
    const { fileName, fileType } = req.body;
    try {
        let s3 = new AWS.S3({
            accessKeyId: process.env.IAM_ACCESS_KEY_ID,
            secretAccessKey: process.env.IAM_SECRET_ACCESS_KEY
        });

        const params = {
            Bucket: 'mychat1',
            Key: fileName,
            ContentType: fileType,
            ACL: 'public-read'
        }

        try {
            const presignedUrl = await s3.getSignedUrlPromise('putObject', params);
            const objectUrl = `https://mychat1.s3.amazonaws.com/${fileName}`;
            console.log(objectUrl);
            res.status(200).json({ url: presignedUrl, objectUrl: objectUrl});
        } catch (err) {
            console.error(err);
            res.status(500).send('Error generating pre-signed URL');
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error, success: false, fileURL: '' });
    }
}
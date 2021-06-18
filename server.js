import http, { IncomingMessage } from 'http';
import util from 'util';
import path from 'path';
import fse from 'fs-extra'
import multiparty from 'multiparty';

const ASSERT_DIR = path.resolve(process.cwd(), 'asserts');

const server = http.createServer(handleRequest)

const resolveMerge = req => {
  return new Promise((resolve) => {
    let chunks = '';
    req.on('data', chunkData => {
      chunks += chunkData;
    })
    req.on('end', () => {
      resolve(JSON.stringify(chunks))
    })
  })
}
const pipeStream = (path, writeStream) => {
  return new Promise((resolve) => {
    const readStream = fse.createReadStream(path);
    readStream.pipe(writeStream);
    readStream.on('end', () => {
      resolve();
    })
  })
}

const mergeFileChunk = async (filePath, size) => {
  const chunkPaths = await fse.readdir(ASSERT_DIR);
  chunkPaths.sort((a, b) => a.split('-')[1] - b.split('-')[1])
  await Promise.all(
    chunkPaths.map((chunkPath, index) => {
      const file = fse.readFileSync(path.resolve(ASSERT_DIR, chunkPath));
      pipeStream(
        path.resolve(ASSERT_DIR, chunkPath),
        fse.createWriteStream(filePath, {
          start: index * file.length,
          end: (index + 1) * file.length,
        })
      );
    })
  );
}

function handleSaveFile(req, res) {
  const form = new multiparty.Form();
  form.parse(req, async function (err, fields, files) {
    if (err) {
      console.log(`[form.parse error]: `, err);
      return;
    }
    console.log(files, fields, "fields");
    const [file] = files.file;

    if (!fse.existsSync(ASSERT_DIR)) {
      await fse.mkdirs(ASSERT_DIR);
    }
    // multiparty是将文件存到临时文件夹，需要将文件以我们的文件名移动到目标文件夹
    const filePath = `${ASSERT_DIR}/${file.originalFilename}`;
    if (!fse.existsSync(filePath)) {
      await fse.move(file.path, filePath);
    } else {
      res.end(util.inspect({
        files,
        fields,
        exist: true,
      }))
      return;
    }
    res.end(util.inspect({
      files,
      fields,
    }))
  });
}

async function handleRequest(req, res) {
  const { url } = req;

  if (url === '/upload' && req.method.toLowerCase() === 'post') {
    handleSaveFile(req, res);
  }

}

server.on('request', async (req, res) => {
  console.log(`[request event]: req.url request incoming`)
})

server.listen(3001, () => {
  console.log('server running on http://localhost:3001');
})

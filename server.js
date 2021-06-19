import http, { IncomingMessage } from 'http';
import util from 'util';
import path from 'path';
import fse from 'fs-extra'
import multiparty from 'multiparty';

const ASSERTS_DIR = path.resolve(process.cwd(), 'asserts');
const SLICE_SIZE = 50 * 1024 * 1024;

const server = http.createServer(handleRequest)

function handleSaveFile(req, res) {
  const form = new multiparty.Form();
  form.parse(req, async function (err, fields, files) {
    if (err) {
      console.log(`[form.parse error]: `, err);
      return;
    }
    // console.log(files, fields, "fields");
    const [file] = files.file;
    const [hash] = fields.hash;

    if (!fse.existsSync(ASSERTS_DIR)) {
      await fse.mkdirs(ASSERTS_DIR);
    }
    // multiparty是将文件存到临时文件夹，需要将文件以我们的文件名命名再移动到目标文件夹
    const filePath = `${ASSERTS_DIR}/${hash}`;
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

async function getFileSlice(filename) {
  const allFiles = await fse.readdir(ASSERTS_DIR);
  return allFiles
    .filter((i) => i.match(new RegExp(`${filename}-\\d`)))
    .sort((a, b) => {
      const idxA = a.match(/\-(\d+)$/)[1];
      const idxB = b.match(/\-(\d+)$/)[1];
      return idxA - idxB;
    });
}

async function mergeFileChunk(files, filename, size = SLICE_SIZE) {
  const mergePromises = files.map((chunkName, index) => {
    return new Promise((resolve) => {
      const readStream = fse.createReadStream(
        path.resolve(ASSERTS_DIR, chunkName)
      );
      const writeStream = fse.createWriteStream(
        path.resolve(ASSERTS_DIR, filename),
        {
          start: index * size,
          end: (index + 1) * size,
        }
      );
      readStream.pipe(writeStream);
      readStream.on('end', () => {
        resolve();
      })
    })
  })
  return await Promise.all(mergePromises);
}

function handleMergeFile(req, res) {
  let chunkData = '';
  req.on('data', function (chunk) {
    chunkData += chunk;
  })
  req.on('end', async function() {
    const parsed = JSON.parse(chunkData || '{}');
    const matchFiles = await getFileSlice(parsed.filename);
    mergeFileChunk(matchFiles, parsed.filename);

    res.end(util.inspect(matchFiles));
  })
}

async function handleRequest(req, res) {
  const { url } = req;

  if (url === '/upload' && req.method.toLowerCase() === 'post') {
    handleSaveFile(req, res);
  }

  if (url === '/merge') {
    handleMergeFile(req, res);
  }

}

server.on('request', async (req, res) => {
  console.log(`[request event]: ${req.url} request incoming`)
})

server.listen(3001, () => {
  console.log('server running on http://localhost:3001');
})

<template>
  <div>
    <div class="upload-container">
      <input type="file" name="upload" id="upload" @change="handleChange">
      <label for="big-file">
        切割上传
        <input
          v-model="isSplit"
          type="checkbox"
          name="big-file"
          id="big-file"
          class="big-file"
        />
      </label>
    </div>
    <ul class="progress-container">
      <li
        v-for="p in progressList"
        class="progress-item"
      >
        <span>{{ p.name }}</span>
        <el-progress :percentage="p.percentage" />
      </li>
    </ul>

    <el-button type="primary" @click="handleUpload">上传</el-button>
  </div>
</template>

<script>
import { ElLoading, ElMessage } from 'element-plus';
const SLICE_SIZE = 50 * 1024 * 1024

export default {
  data() {
    return {
      isSplit: false,
      file: null,
      percentage: 0,
      progressList: [],
    }
  },
  methods: {
    handleChange(evt) {
      const [file] = evt.target.files;
      this.file = file;
      this.percentage = 0;
    },
    showLoading() {
      this.loadingInst = ElLoading.service({ fullscreen: true, text: '准备中...' });
    },
    hideLoading() {
      if (this.loadingInst) {
        this.loadingInst.close()
      }
    },
    wait(time) {
      return new Promise(r => {
        this.showLoading();
        setTimeout(r, time)
      })
    },
    createFileSlice(file, size = SLICE_SIZE) {
      const fileSlices = []
      let cursor = 0;
      while (cursor < file.size) {
        fileSlices.push(file.slice(cursor, cursor + size));
        cursor += size;
      }
      return fileSlices;
    },
    async uploadFile() {
      if (this.isSplit) {
        const uploadList = this.createFileSlice(this.file)
          .map(
            (chunk, index) => {
              const formData = new FormData();
              const chunkHash = `${this.file.name}-${index}`;
              formData.append('file', chunk);
              formData.append('hash', chunkHash);
              this.progressList.push({
                name: chunkHash,
                percentage: 0,
              })
              return formData;
            }
          )
          .map(
            formdata => this.request({
              url: '/upload',
              method: 'post',
              data: formdata,
              onUploadProgress: this.handleUploadProgress(formdata.get('hash')),
            })
          )
        return await Promise.all(uploadList);
      }

      const formData = new FormData();
      formData.append('file', this.file);
      formData.append('hash', this.file.name);

      this.progressList.push({
        name: this.file.name,
        percentage: 0
      })
      this.hideLoading();
    
      const res = await this.request({
        url: '/upload',
        method: 'post',
        data: formData,
        onUploadProgress: this.handleUploadProgress(this.file.name)
      })
      return res;
    },
    handleUploadProgress(filename) {
      return (evt) => {
        const { loaded, total } = evt;
        const idx = this.progressList.findIndex(i => i.name === filename);
        this.progressList[idx] = {
          name: filename,
          percentage: Math.ceil(loaded / total * 100),
        }

      }
    },
    async handleMerge() {
      await this.request({
        url: '/merge',
        method: 'post',
        headers: {
          'content-type': 'application/json',
        },
        data: JSON.stringify({
          filename: this.file.name
        })
      })
      ElMessage.success('上传成功!')
    },
    async handleUpload() {
      if (!this.file) return;
      this.progressList = [];
      try {
        await this.uploadFile();
        if (this.isSplit) {
          this.handleMerge();
        }
      } catch (e) {
        console.error(e)
      }
    },
  }
}
</script>

<style lang="postcss">
.upload-container {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  width: 200px;
  height: 200px;
  box-shadow: 0 0 10px #1fa;
  margin-bottom: 30px;
}

.progress-container {
  width: 80%;
  margin: auto;
  list-style: none;

}
.progress-item {
  display: flex;
}
.progress-item span {
  width: 12%;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  margin-right: 20px;
}

.progress-item .el-progress {
  flex: 1;
}
</style>

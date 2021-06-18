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
    <el-progress :percentage="percentage" />

    <el-button type="primary" @click="handleUpload">上传</el-button>
  </div>
</template>

<script>
const SIZE = 10 * 1024 * 1024;
import { ElLoading } from 'element-plus';

export default {
  data() {
    return {
      isSplit: false,
      file: null,
      percentage: 0,
      fileSlices: [],
    }
  },
  methods: {
    handleChange(evt) {
      const [file] = evt.target.files;
      this.file = file;
      this.percentage = 0;
    },
    createFileSlice(file, size = SIZE) {
      const fileSlices = []
      let cursor = 0;
      while (cursor < file.size) {
        fileSlices.push(file.slice(cursor, cursor + size));
        cursor += size;
      }
      return fileSlices;
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
    handelProgress(e) {
      console.log(e)
    },
    async uploadFile() {
      const formData = new FormData();
      
      if (this.isSplit) {
        file = this.createFileSlice(this.file).map((chunk, index) => {

        })
        const uploadList = fileSlices.map(formdata => this.request({
            url: '/upload',
            method: 'post',
            data: formdata,
        }))
        return await Promise.all(uploadList);
      }

      formData.append('file', this.file);
      formData.append('filename', this.file.name)

      await this.wait(1000 * 3)
      this.hideLoading();

      const res = await this.request({
        url: '/upload',
        method: 'post',
        data: formData,
        listeners: [{
          name: 'progress',
          handler: this.handleUploadProgress
        }]
      })
      return res;
    },
    handleUploadProgress(evt) {
      const { loaded, total } = evt;
      this.percentage = Math.ceil(loaded / total * 100);
    },
    async handleMerge() {
      this.request({
        url: '/merge',
        method: 'post',
        headers: {
          'content-type': 'application/json',
        },
        data: JSON.stringify({
          filename: this.file.name
        })
      })
    },
    async handleUpload() {
      if (!this.file) return;
      const res = await this.uploadFile();
      this.handleMerge();
      console.log(res, 'response');
    },
  }
}
</script>

<style scoped>
.upload-container {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  width: 200px;
  height: 200px;
  box-shadow: 0 0 10px #1fa;
  margin-bottom: 30px;
}
</style>

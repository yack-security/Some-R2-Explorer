<template>
  <ul id="right-click-menu" ref="menu" tabindex="-1" v-if="viewMenu" @blur="closeMenu" :style="{ top: top, left: left }">
    <li class="pointer" v-if="canPreview" @click="openFile">
      <i class="bi bi-box-arrow-in-right me-1"></i>Open</li>
    <!--    <li class="pointer" @click="notImplemented">-->
    <!--      <i class="bi bi-share-fill me-1"></i>Get Sharable Link-->
    <!--    </li>-->
    <template v-if="this.file?.isFile">
      <li class="pointer" v-if="$store.state.config?.curlFeature" @click="copyCurlCommand" :data-id="$store.state.config.CF_ID" :data-secret="$store.state.config?.CF_SECRET">
        <i class="bi bi-clipboard me-1"></i>Copy cURL Command
      </li>
      <li class="pointer" v-if="isPs1File && $store.state.config?.curlFeature" @click="copyPowershellCommand" :data-id="$store.state.config.CF_ID" :data-secret="$store.state.config?.CF_SECRET">
        <i class="bi bi-clipboard me-1"></i>Copy PowerShell Command
      </li>
      <li class="pointer" @click="renameFile">
        <i class="bi bi-pencil-fill me-1"></i>Rename
      </li>
      <li class="pointer" @click="downloadFile">
        <i class="bi bi-cloud-download-fill me-1"></i>Download
      </li>
      <li class="pointer" @click="deleteFile">
        <i class="bi bi-trash-fill me-1"></i>Remove
      </li>
    </template>
  </ul>
</template>
<script>
  import Swal from 'sweetalert2'
  import repo from '@/api'


  export default {
    data: function () {
      return {
        file: undefined,
        canPreview: false,
        viewMenu: false,
        top: '0px',
        left: '0px',
        downloadUrl: '',
        name: ''
      }
    },

    computed: {
      isPs1File: function() {
        if (!this.file) return false;
        const encodedFilename = this.downloadUrl.split('/').pop();
        const decodedPath = atob(encodedFilename);
        const decodedFilename = decodedPath.split('/').pop();
        return decodedFilename.endsWith('.ps1');
      }
    },

    methods: {
      setMenu: function (top, left) {
        const largestHeight = window.innerHeight - this.$refs.menu.offsetHeight - 25
        const largestWidth = window.innerWidth - this.$refs.menu.offsetWidth - 25

        if (top > largestHeight) top = largestHeight

        if (left > largestWidth) left = largestWidth

        this.top = top + 'px'
        this.left = left + 'px'
      },

      closeMenu: function () {
        this.viewMenu = false
      },
      downloadFile: function () {
        const link = document.createElement('a')
        link.download = this.file.name
        link.href = this.downloadUrl
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        this.closeMenu()
      },
      openMenu: function (e, obj) {
        this.file = obj
        this.viewMenu = true
        this.canPreview = obj.preview !== undefined || obj.isFolder === true
        this.name = obj.name

        let prefix = ''
        if (process.env.NODE_ENV === 'development') {
          prefix = 'http://localhost:8787'
        }
        this.downloadUrl = `${prefix}/api/buckets/${this.$store.state.activeBucket}/${btoa(unescape(encodeURIComponent(`${this.$store.state.currentFolder}${obj.name}`)))}`

        this.$nextTick(
          function () {
            this.$refs.menu.focus()

            this.setMenu(e.y, e.x)
          }.bind(this)
        )
        // e.preventDefault()
      },
      deleteFile () {
        const self = this

        Swal.fire({
          title: 'Are you sure?',
          text: "You won't be able to revert this!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
          if (result.isConfirmed) {
            repo.deleteObject(self.file.path, self.file.name).then(() => {
              this.$store.dispatch('makeToast', {
                message: 'File deleted', timeout: 5000
              })
              self.$store.dispatch('refreshObjects')
            })
          }

          self.closeMenu()
        })
      },
      renameFile () {
        const self = this

        Swal.fire({
          title: 'Rename file',
          input: 'text',
          inputValue: self.file.name,
          showCancelButton: true,
          inputValidator: (value) => {
            if (!value) {
              return 'You need to write something!'
            }
          }
        }).then((data) => {
          if (data.isConfirmed === true) {
            repo.renameObject(self.file.name, data.value).then(() => {
              this.$store.dispatch('makeToast', {
                message: 'File renamed', timeout: 5000
              })
              self.$store.dispatch('refreshObjects')
            })
          }

          self.closeMenu()
        })
      },
      copyCurlCommand: function(event) {

        const baseUrl = window.location.origin;
        const fullDownloadUrl = `${baseUrl}${this.downloadUrl}`;
        const encodedFilename = this.downloadUrl.split('/').pop();
        const decodedPath = atob(encodedFilename);
        const decodedFilename = decodedPath.split('/').pop();

        const CF_ID = event.target.getAttribute('data-id');
        const CF_SECRET = event.target.getAttribute('data-secret');
        //console.log(CF_ID);
        //console.log(CF_SECRET);

        const curlCommand = `curl "${fullDownloadUrl}" -H "CF-Access-Client-Id: ${CF_ID}" -H "CF-Access-Client-Secret: ${CF_SECRET}" -o "${decodedFilename}"`;
        // Copy the cURL command to the clipboard
        navigator.clipboard.writeText(curlCommand)
        .then(() => {
          this.$store.dispatch('makeToast', {
            message: 'cURL command copied to clipboard!', timeout: 5000
          })
          self.$store.dispatch('refreshObjects')
        })
        .catch(err => console.error('Failed to copy text to clipboard', err));
        this.closeMenu();
      },

      copyPowershellCommand : function (event) { // Get the current protocol and host
        const baseUrl = window.location.origin;
        const fullDownloadUrl = `${baseUrl}${this.downloadUrl}`;
        const encodedFilename = this.downloadUrl.split('/').pop();
        const decodedPath = atob(encodedFilename);
        const decodedFilename = decodedPath.split('/').pop();

        const CF_ID = event.target.getAttribute('data-id');
        const CF_SECRET = event.target.getAttribute('data-secret');

        const powershellCommand = `iex(iwr -UseBasicParsing -Uri '${fullDownloadUrl}' -Headers @{'CF-Access-Client-Id' = '${CF_ID}'; 'CF-Access-Client-Secret' = '${CF_SECRET}'});`;
        // Copy the PowerShell command to the clipboard
        navigator
          .clipboard
          .writeText(powershellCommand)
          .then(() => {
            this.$store.dispatch('makeToast', {
              message: 'Powershell command copied to clipboard!', timeout: 5000
            })
            self.$store.dispatch('refreshObjects')
          })
          .catch(err => console.error('Failed to copy text to clipboard', err));
        this.closeMenu();
      },

      openFile () {
        this.$emit('openFile', this.file)
        this.closeMenu()
      },
      notImplemented () {
        this.$store.dispatch('makeToast', {
          message: 'Not implemented yet', timeout: 5000
        })
        this.closeMenu()
      }
    }
  }
  </script>

  <style lang="scss" scoped>
  #right-click-menu {
    background: #fafafa;
    border: 1px solid #bdbdbd;
    box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 3px 1px -2px rgba(0, 0, 0, 0.2), 0 1px 5px 0 rgba(0, 0, 0, 0.12);
    display: block;
    list-style: none;
    margin: 0;
    padding: 0;
    position: fixed;
    //width: 250px;
    z-index: 999999;
  }

  #right-click-menu li {
    border-bottom: 1px solid #e0e0e0;
    margin: 0;
    padding: 5px;
  }

  #right-click-menu li:last-child {
    border-bottom: none;
  }

  #right-click-menu li:hover {
    background: #1e88e5;
    color: #fafafa;
  }

  a {
    color: unset
  }

  a:hover {
    color: unset
  }
  </style>
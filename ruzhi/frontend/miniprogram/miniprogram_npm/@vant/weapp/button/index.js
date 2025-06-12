Component({
  externalClasses: ['custom-class'],
  properties: {
    type: {
      type: String,
      value: 'default'
    },
    size: {
      type: String,
      value: 'normal'
    },
    text: {
      type: String,
      value: ''
    },
    color: {
      type: String,
      value: ''
    },
    icon: {
      type: String,
      value: ''
    },
    classPrefix: {
      type: String,
      value: 'van-icon'
    },
    plain: {
      type: Boolean,
      value: false
    },
    block: {
      type: Boolean,
      value: false
    },
    round: {
      type: Boolean,
      value: false
    },
    square: {
      type: Boolean,
      value: false
    },
    loading: {
      type: Boolean,
      value: false
    },
    hairline: {
      type: Boolean,
      value: false
    },
    disabled: {
      type: Boolean,
      value: false
    },
    loadingText: {
      type: String,
      value: ''
    },
    loadingType: {
      type: String,
      value: 'circular'
    },
    loadingSize: {
      type: String,
      value: '20px'
    },
    openType: String,
    appParameter: String,
    hoverStopPropagation: Boolean,
    hoverStartTime: {
      type: Number,
      value: 20
    },
    hoverStayTime: {
      type: Number,
      value: 70
    },
    lang: {
      type: String,
      value: 'en'
    },
    sessionFrom: {
      type: String,
      value: ''
    },
    sendMessageTitle: String,
    sendMessagePath: String,
    sendMessageImg: String,
    showMessageCard: Boolean,
    businessId: Number
  },
  methods: {
    onClick(event) {
      if (!this.data.loading && !this.data.disabled) {
        this.triggerEvent('click', event.detail);
      }
    },
    onGetUserInfo(event) {
      this.triggerEvent('getuserinfo', event.detail);
    },
    onContact(event) {
      this.triggerEvent('contact', event.detail);
    },
    onGetPhoneNumber(event) {
      this.triggerEvent('getphonenumber', event.detail);
    },
    onError(event) {
      this.triggerEvent('error', event.detail);
    },
    onLaunchApp(event) {
      this.triggerEvent('launchapp', event.detail);
    },
    onOpenSetting(event) {
      this.triggerEvent('opensetting', event.detail);
    }
  }
});

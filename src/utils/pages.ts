import Taro from '@tarojs/taro'

class Pages {

  	/**
	 * 跳转外部页面
	 * url: 跳转链接
	 * jumpType: 跳转类型 navigateTo redirectTo
	 */
	jumpToOutside(url: string, jumpType?: 'navigateTo' | 'redirectTo') {
		console.log('外部链接', url)
		if (!url) {
			console.error('url不能为空')
			return
		}
		if (process.env.TARO_ENV === 'weapp') {
			const pageUrl = `/pages/webview/outside?url=${encodeURIComponent(url)}`
			if (jumpType === 'navigateTo') {
				Taro.navigateTo({
					url: pageUrl,
				})
			} else if (jumpType === 'redirectTo') {
				Taro.redirectTo({
					url: pageUrl,
				})
			}
		} else {
			window.location.href = url
		}
	}

}

export default new Pages()

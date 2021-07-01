import { ComponentType } from 'react'
import Taro, { Component, Config } from '@tarojs/taro'
import { RichText, View } from '@tarojs/components'
import { observer, inject } from '@tarojs/mobx'
import { md, html } from '~/utils/data'
import MpParseHtml from '~/components/MpParseHtml'
import './index.scss'

type PageStateProps = {
	counterStore: {
		counter: number
		increment: Function
		decrement: Function
		incrementAsync: Function
	}
}

interface Index {
	props: PageStateProps
}

@inject('counterStore')
@observer
class Index extends Component {
	componentWillMount() {
		console.log('componentWillMount')
	}

	componentDidMount() {
		console.log('componentDidMount')
    this.handleImgClick()
	}

	componentWillUnmount() {
		console.log('componentWillUnmount')
	}

	componentWillReact() {
		console.log('componentWillReact')
	}

	componentDidShow() {
		console.log('componentDidShow')
	}

	componentDidHide() {
		console.log('componentDidHide')
	}

	/**
	 * 指定config的类型声明为: Taro.Config
	 *
	 * 由于 typescript 对于 object 类型推导只能推出 Key 的基本类型
	 * 对于像 navigationBarTextStyle: 'black' 这样的推导出的类型是 string
	 * 提示和声明 navigationBarTextStyle: 'black' | 'white' 类型冲突, 需要显示声明类型
	 */
	config: Config = {
		navigationBarTitleText: '富文本解析示例'
	}


	/**
	 * 解决文章内容商品自定义标签事件问题
	 * 图片宽高自适应
	 */
	handleImgClick() {
		if (process.env.TARO_ENV === 'h5') {
			let windowWidth = 0
			Taro.getSystemInfo({
				success(res) {
					console.log('系统信息宽高', res)
					windowWidth = res.windowWidth
				},
			})
			// 获取所有图片标签
			const nodes: any = document
				.getElementById('rich-text-content')
				.getElementsByTagName('img')
			if (nodes && nodes.length) {
				for (let index = 0; index < nodes.length; index++) {
					const element = nodes[index]
					const path = element.attributes.goodurl
						? element.attributes.goodurl.value
						: ''
					element.onclick = function () {
						if (path) {
							// 商品跳转商品详情页
							Taro.navigateTo({
								url: path,
							})
						} else {
							Taro.previewImage({
								current: element.src,
								urls: [element.src],
							})
						}
					}
					// 处理图片宽高适配
					element.onload = function (e) {
						let autoWidth = 0,
							autoHeight = 0
						const originalWidth: any = e.target.width
						const originalHeight: any = e.target.height
						// 判断按照哪种方式进行缩放
						if (originalWidth > windowWidth) {
							// 在图片width大于手机屏幕width时候
							autoWidth = windowWidth * 0.89 // UI稿是89%
							autoHeight = (autoWidth * originalHeight) / originalWidth
						} else {
							// 否则展示原来数据
							autoWidth = originalWidth
							autoHeight = originalHeight
						}
						element.width = autoWidth
						element.height = autoHeight
					}
				}
			}
		}
	}

	render() {
		return (
			<View className='rich-text-page'>
				<View className='title'>1. html解析</View>
				<View className='content'>
          {
            process.env.TARO_ENV === 'weapp' ?
					  <MpParseHtml nodes={html} language='html' />
            :
            <RichText
            id='rich-text-content'
            className='rich-text-content'
             nodes={html}></RichText>
          }
				</View>
				<View className='title'>2. markdown文本解析</View>
				<View className='content'>
          {
            process.env.TARO_ENV === 'weapp' ?
            <MpParseHtml nodes={md} language='md' />
            :
            <RichText nodes={md}></RichText>
          }
				</View>
			</View>
		)
	}
}

export default Index as ComponentType

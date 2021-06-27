import { ComponentType } from 'react'
import Taro, { Component, Config } from '@tarojs/taro'
import { View } from '@tarojs/components'
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

	render() {
		return (
			<View className='rich-text-page'>
				<View className='title'>1. html解析</View>
				<View className='content'>
					<MpParseHtml nodes={html} language='html' />
				</View>
				<View className='title'>2. markdown文本解析</View>
				<View className='content'>
					<MpParseHtml nodes={md} language='md' />
				</View>
			</View>
		)
	}
}

export default Index as ComponentType

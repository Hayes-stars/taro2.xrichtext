import { ComponentType } from 'react'
import Taro, { Component, Config } from '@tarojs/taro'
import { View, Button, Text } from '@tarojs/components'
import { observer, inject } from '@tarojs/mobx'

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
	/**
	 * 指定config的类型声明为: Taro.Config
	 *
	 * 由于 typescript 对于 object 类型推导只能推出 Key 的基本类型
	 * 对于像 navigationBarTextStyle: 'black' 这样的推导出的类型是 string
	 * 提示和声明 navigationBarTextStyle: 'black' | 'white' 类型冲突, 需要显示声明类型
	 */
	config: Config = {
		navigationBarTitleText: '首页'
	}

	componentWillMount() {}

	componentWillReact() {
		console.log('componentWillReact')
	}

	componentDidMount() {}

	componentWillUnmount() {}

	componentDidShow() {}

	componentDidHide() {}

	increment = () => {
		const { counterStore } = this.props
		counterStore.increment()
	}

	decrement = () => {
		const { counterStore } = this.props
		counterStore.decrement()
	}

	incrementAsync = () => {
		const { counterStore } = this.props
		counterStore.incrementAsync()
	}

	onJumpRichText() {
		Taro.navigateTo({
			url: '/pages/richTextPage/index'
		})
	}

	onJumpCodePage() {
		Taro.navigateTo({
			url: '/pages/hightLightPage/index'
		})
	}

	render() {
		const {
			counterStore: { counter }
		} = this.props
		return (
			<View className='index'>
				<Button onClick={this.increment}>+</Button>
				<Button onClick={this.decrement}>-</Button>
				<Button onClick={this.incrementAsync}>Add Async</Button>
				<Text>{counter}</Text>
				<View className='rich-text-content'>
					<Button onClick={this.onJumpRichText.bind(this)}>
						1. 富文本组件
					</Button>
					<Button onClick={this.onJumpCodePage.bind(this)}>
						2. 代码高亮组件
					</Button>
				</View>
			</View>
		)
	}
}

export default Index as ComponentType

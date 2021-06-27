import { ComponentType } from 'react'
import Taro, { Component, Config } from '@tarojs/taro'
import { View } from '@tarojs/components'
import { observer, inject } from '@tarojs/mobx'

import HightLightCode from '~/components/HightLightCode'
import {
	jsCode,
	cssCode,
	htmlCode,
	markdownCode,
	sqlCode,
	tsCode,
	cppCode
} from '~/utils/data'

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
		navigationBarTitleText: '代码高亮示例'
	}
	render() {
		return (
			<View className='hight-light-page'>
				<View className='title'>js代码解析</View>
				<View className='content'>
					<HightLightCode codeText={jsCode} language='javascript' />
				</View>
				<View className='title'>css代码解析</View>
				<View className='content'>
					<HightLightCode codeText={cssCode} language='css' />
				</View>
				<View className='title'>html代码解析</View>
				<View className='content'>
					<HightLightCode codeText={htmlCode} language='html' />
				</View>
				<View className='title'>markdown代码解析</View>
				<View className='content'>
					<HightLightCode codeText={markdownCode} language='markdown' />
				</View>
				<View className='title'>sql代码解析</View>
				<View className='content'>
					<HightLightCode codeText={sqlCode} language='sql' />
				</View>
				<View className='title'>ts代码解析</View>
				<View className='content'>
					<HightLightCode codeText={tsCode} language='typescript' />
				</View>
				<View className='title'>c++代码解析</View>
				<View className='content'>
					<HightLightCode codeText={cppCode} language='c++' />
				</View>
			</View>
		)
	}
}

export default Index as ComponentType

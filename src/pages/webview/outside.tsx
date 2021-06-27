/**
 * 外部链接跳转
 */

import { ComponentType } from 'react'
import Taro, { Component } from '@tarojs/taro'
import { View, WebView } from '@tarojs/components'
import { observer, inject } from '@tarojs/mobx'


import './outside.scss'

/**
 * 页面 props
 */
interface OutSideProps {
	app: any
}

/**
 * 页面 state
 */
interface OutSideState {
	url: string
}

interface Outside {
	props: OutSideProps
	state: OutSideState
}

@inject('app')
@observer
class Outside extends Component {
	constructor(props) {
		super(props)
		this.state = {
			url: '',
		}
	}

	// config: Config = {
	// 	enablePullDownRefresh: false,
	// }

	componentWillMount() {
		const { url } = this.$router.params
		console.log('out side url', decodeURIComponent(url))
		this.setState({
			url: decodeURIComponent(url),
		})
	}

	// 监听mobx状态变化
	componentWillReact() {
		console.log('componentWillReact', this.props)
	}

	handleMessage(e) {
		console.log('message', e)
	}

	render() {
		const { url } = this.state
		console.log('web view outside render', url)
		return (
			<View className='webview-outside-page'>
				<WebView src={url} onMessage={this.handleMessage} />
			</View>
		)
	}
}

export default Outside as ComponentType

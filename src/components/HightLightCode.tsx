/**
 * 代码高亮显示
 */

import Taro, { Component } from '@tarojs/taro'
import { View, RichText } from '@tarojs/components'

import hljs from 'highlight.js'

import './HightLightCode.scss'
import './rainbow.scss'

// 支持的解析语言列表
const LANGUAGE_LIST = [
	'javascript',
	'css',
	'xml',
	'sql',
	'typescript',
	'markdown',
	'c++',
	'c'
]

/**
 * props属性
 */
interface HLCProps {
	codeText: string
	language: string
}

/**
 * 组件内部属性
 */
interface HLCState {
	code: string
}

class HighlightCode extends Component<HLCProps, HLCState> {
	static defaultProps: HLCProps = {
		codeText: '',
		language: 'javascript'
	}

	constructor(props) {
		super(props)
		this.state = {
			code: ''
		}
	}

	componentWillMount() {
		const { codeText, language } = this.props
		this.parseCode(codeText, language)
	}

	// 解析code
	parseCode(input, language) {
		const lang = LANGUAGE_LIST.includes(language) ? language : 'javascript'
		const { value } = hljs.highlight(input, {language: lang, ignoreIllegals: true})
		const highlighted = value.replace('&amp;', '&').trim()

		let codeResult = `<code class="${lang}">${highlighted}</code>`
		codeResult = codeResult.replace(/\n/g, '<br/>').replace('<code>', '')

		this.setState({ code: codeResult })
	}

	render() {
		const { code } = this.state

		return (
			<View className='highlightCode-comp'>
        <View className='hljs'>
				  <RichText nodes={code} space='nbsp'></RichText>
        </View>
			</View>
		)
	}
}

export default HighlightCode

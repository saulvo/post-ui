import postsAPI from './api/postApi.js'
import AppConstants from './appConstants.js'
import utils from './utils.js'

const renderPostList = (postList) => {
	const ulPostListElement = document.querySelector('#postsList')

	postList.forEach((post) => {
		const templateElement = document.querySelector('#postItemTemplate')
		if (!templateElement) return

		// Clone li
		const liElementFromTemplate = templateElement.content.querySelector('li')
		const newLiElement = liElementFromTemplate.cloneNode(true)

		// fill data
		// set image
		const postImgElement = newLiElement.querySelector('#postItemImage')

		if (postImgElement) {
			// set src image
			const thumb = post.imageUrl || AppConstants.DEFAULT_IMAGE_URL
			const arrSrc = thumb.split('/')
			const src = arrSrc.splice(0, arrSrc.length - 2)

			postImgElement.src = [
				...src,
				AppConstants.SMALLER_IMAGE_WIDTH,
				AppConstants.SMALLER_IMAGE_HEIGHT,
			].join('/')

			// set alt image
			postImgElement.alt = post.title

			// handle error image
			postImgElement.setAttribute(
				'onerror',
				`this.onerror=null;
				 this.src='${AppConstants.DEFAULT_IMAGE_URL}';
				`,
			)
		}

		//set title
		const cardTitleElement = newLiElement.querySelector('#postItemTitle')
		if (cardTitleElement) cardTitleElement.textContent = post.title

		//set description
		const descriptionElement = newLiElement.querySelector('#postItemDescription')
		if (descriptionElement)
			descriptionElement.textContent = utils.truncateTextlength(post.description, 100)

		// set author
		const authorElement = newLiElement.querySelector('#postItemAuthor')
		if (authorElement) authorElement.textContent = post.author

		// set time
		const timeElement = newLiElement.querySelector('#postItemTimeSpan')
		if (timeElement) timeElement.textContent = ` - ${utils.formatDate(post.createdAt)}`

		// add click event for div post
		const postElement = newLiElement.querySelector('#postItem')
		if (postElement) {
			postElement.addEventListener('click', () => {
				window.location = `/post-detail.html?id=${post.id}`
			})
		}
		// add click event for button edit
		const editButtonElement = newLiElement.querySelector('#postItemEdit')
		if (editButtonElement) {
			editButtonElement.addEventListener('click', (e) => {
				e.stopPropagation()
				window.location = `/add-edit-post.html?postId=${post.id}`
			})
		}

		// add click event for button remove
		const removeButtonElement = newLiElement.querySelector('#postItemRemove')
		if (removeButtonElement) {
			removeButtonElement.addEventListener('click', (e) => {
				e.stopPropagation()
				const message = `Are you sure to remove post: ${post.title}?`

				// show confirm
				utils.confirmBox(message, async () => {
					try {
						await postsAPI.remove(post.id)
						newLiElement.remove()

						// Reload current page
						window.location.reload()
						setTimeout(() => {}, 500)
					} catch (error) {
						utils.showNotification('Failed to remove post', 1)
						console.log('Failed to remove post:', error)
					}
				})
			})
		}
		// append li to ul
		ulPostListElement.appendChild(newLiElement)
	})
}

const getPageList = (pagination) => {
	const {_limit, _totalRows, _page} = pagination
	const totalPages = Math.ceil(_totalRows / _limit)

	const prev = _page - 1
	const current = _page
	const next = _page + 1

	// active first page
	if (_page === 1) {
		return [
			prev - 1,
			current,
			next > totalPages ? -1 : next,
			next + 1 > totalPages ? -1 : next + 1,
			next > totalPages ? -1 : next,
		]
	}

	// active last page
	if (_page === totalPages) {
		return [prev < 0 ? -1 : prev, prev - 1 < 0 ? -1 : prev - 1, prev < 0 ? -1 : prev, current, -1]
	}

	return [prev, prev, current, next, next]
}

const renderPostsPagination = (pagination) => {
	const postPaginationElement = document.querySelector('#postsPagination')
	if (postPaginationElement) {
		const pageItemsElement = postPaginationElement.querySelectorAll('.page-item')
		if (pageItemsElement.length !== 5) return // only 5 item

		const {_page, _limit} = pagination
		const pageList = getPageList(pagination)

		pageItemsElement.forEach((item, idx) => {
			const linkElement = item.querySelector('.page-link')

			// set links
			if (linkElement) {
				linkElement.href =
					pageList[idx] !== _page ? `?_page=${pageList[idx]}&_limit=${_limit}` : 'javascript:;'
			}

			// set text
			if (idx > 0 && idx < 4) linkElement.textContent = pageList[idx]

			// disabled prev / next button
			if (pageList[idx] === -1) {
				item.classList.add('disabled')
			}

			// set active for current page
			if (idx > 0 && idx < 4 && pageList[idx] === _page) {
				item.classList.add('active')
			}
		})

		// Show pagination
		postPaginationElement.removeAttribute('hidden')
	}
}

const animePostList = (postsElement) => {
	postsElement.forEach((el, idx) => {
		el.style.cssText =
			'transform: translateY(50px) scale(0);opacity: 0;transition: all 0.5s ease-in-out;'

		setTimeout(() => {
			el.style.cssText =
				'transform: translateY(0) scale(1);opacity: 1;transition: all 0.5s ease-in-out;'
		}, idx * 100)
	})
}

;(async function () {
	try {
		let search = window.location.search

		search = search ? search.substring(1) : ''
		const {_page, _limit} = utils.parseUrlString(search)

		const params = {
			_page: _page || AppConstants.DEFAULT_PAGE,
			_limit: _limit || AppConstants.DEFAULT_LIMIT,
			_sort: 'updatedAt',
			_order: 'desc',
		}

		const response = await postsAPI.getAll(params)
		const {data: posts, pagination} = response

		renderPostList(posts)
		renderPostsPagination(pagination)

		// hide loader
		const loaderElement = document.querySelector('.loader')
		if (loaderElement) loaderElement.classList.add('hide')

		// animate post list
		const postItemsElement = document.querySelectorAll('#postsList > li')
		if (postItemsElement.length > 0) animePostList(postItemsElement)
	} catch (error) {
		utils.showNotification('Failed to get list of posts!', 1)
		console.log('Failed to get list of posts: ', error)
	}
})()

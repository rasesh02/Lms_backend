class ShowError {
    constructor(statusCode,message = "Failed",error){
        this.statusCode = statusCode
        this.message = message
        this.error=error
    }
}

export { ShowError}
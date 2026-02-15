Class SpectraSight.REST.Response [ Abstract ]
{

/// Return a success response with data (HTTP 200)
ClassMethod Success(pData As %DynamicAbstractObject) As %Status
{
    Set tSC = $$$OK
    Try {
        Set tEnvelope = ##class(%DynamicObject).%New()
        Do tEnvelope.%Set("data", pData)
        Set %response.ContentType = "application/json"
        Set %response.Status = "200 OK"
        Write tEnvelope.%ToJSON()
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

/// Return a created response with data (HTTP 201)
ClassMethod Created(pData As %DynamicAbstractObject) As %Status
{
    Set tSC = $$$OK
    Try {
        Set tEnvelope = ##class(%DynamicObject).%New()
        Do tEnvelope.%Set("data", pData)
        Set %response.ContentType = "application/json"
        Set %response.Status = "201 Created"
        Write tEnvelope.%ToJSON()
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

/// Return a 204 No Content response (used for DELETE)
ClassMethod SuccessNoContent() As %Status
{
    Set tSC = $$$OK
    Try {
        Set %response.Status = "204 No Content"
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

/// Return a paginated list response
ClassMethod PaginatedList(pData As %DynamicArray, pTotal As %Integer, pPage As %Integer, pPageSize As %Integer) As %Status
{
    Set tSC = $$$OK
    Try {
        Set tEnvelope = ##class(%DynamicObject).%New()
        Do tEnvelope.%Set("data", pData)
        Do tEnvelope.%Set("total", pTotal, "number")
        Do tEnvelope.%Set("page", pPage, "number")
        Do tEnvelope.%Set("pageSize", pPageSize, "number")
        Set tTotalPages = $SELECT(pTotal=0:0, 1:((pTotal - 1) \ pPageSize) + 1)
        Do tEnvelope.%Set("totalPages", tTotalPages, "number")
        Set %response.ContentType = "application/json"
        Set %response.Status = "200 OK"
        Write tEnvelope.%ToJSON()
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

/// Return an error response with code, message, and HTTP status
ClassMethod Error(pCode As %String, pMessage As %String, pHttpStatus As %Integer) As %Status
{
    Set tSC = $$$OK
    Try {
        Set tErrorObj = ##class(%DynamicObject).%New()
        Do tErrorObj.%Set("code", pCode)
        Do tErrorObj.%Set("message", pMessage)
        Do tErrorObj.%Set("status", pHttpStatus, "number")
        Set tEnvelope = ##class(%DynamicObject).%New()
        Do tEnvelope.%Set("error", tErrorObj)
        Set %response.ContentType = "application/json"
        Set %response.Status = ..GetHttpStatusText(pHttpStatus)
        Write tEnvelope.%ToJSON()
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

/// Convenience: 404 Not Found
ClassMethod NotFound(pMessage As %String = "Resource not found") As %Status
{
    Quit ..Error("NOT_FOUND", pMessage, 404)
}

/// Convenience: 400 Bad Request
ClassMethod BadRequest(pMessage As %String) As %Status
{
    Quit ..Error("BAD_REQUEST", pMessage, 400)
}

/// Convenience: 500 Internal Server Error
ClassMethod ServerError(pMessage As %String = "Internal server error") As %Status
{
    Quit ..Error("INTERNAL_ERROR", pMessage, 500)
}

/// Map HTTP status code to status text
ClassMethod GetHttpStatusText(pStatusCode As %Integer) As %String
{
    Set tResult = pStatusCode_" Error"
    Try {
        If pStatusCode = 200 {
            Set tResult = "200 OK"
        } ElseIf pStatusCode = 201 {
            Set tResult = "201 Created"
        } ElseIf pStatusCode = 204 {
            Set tResult = "204 No Content"
        } ElseIf pStatusCode = 400 {
            Set tResult = "400 Bad Request"
        } ElseIf pStatusCode = 401 {
            Set tResult = "401 Unauthorized"
        } ElseIf pStatusCode = 404 {
            Set tResult = "404 Not Found"
        } ElseIf pStatusCode = 409 {
            Set tResult = "409 Conflict"
        } ElseIf pStatusCode = 500 {
            Set tResult = "500 Internal Server Error"
        }
    }
    Catch ex {
        Set tResult = "500 Internal Server Error"
    }
    Quit tResult
}

}

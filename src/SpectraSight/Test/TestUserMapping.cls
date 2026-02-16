Class SpectraSight.Test.TestUserMapping Extends %UnitTest.TestCase
{

Method TestUserMappingCreate() As %Status
{
    Set tMapping = ##class(SpectraSight.Model.UserMapping).%New()
    Set tMapping.IrisUsername = "_SYSTEM"
    Set tMapping.DisplayName = "System Admin"
    Set tSC = tMapping.%Save()
    Do $$$AssertStatusOK(tSC, "UserMapping should save successfully")

    Set tId = tMapping.%Id()
    Do $$$AssertTrue(tId '= "", "UserMapping should have an ID after save")

    Set tLoaded = ##class(SpectraSight.Model.UserMapping).%OpenId(tId)
    Do $$$AssertEquals(tLoaded.IrisUsername, "_SYSTEM", "IrisUsername should match")
    Do $$$AssertEquals(tLoaded.DisplayName, "System Admin", "DisplayName should match")
    Do $$$AssertEquals(tLoaded.IsActive, 1, "IsActive should default to true")
    Do $$$AssertTrue(tLoaded.CreatedAt '= "", "CreatedAt should be set")
    Do $$$AssertTrue(tLoaded.UpdatedAt '= "", "UpdatedAt should be set")

    Do ##class(SpectraSight.Model.UserMapping).%DeleteId(tId)
    Quit $$$OK
}

Method TestUserMappingUsernameUnique() As %Status
{
    Set tMapping1 = ##class(SpectraSight.Model.UserMapping).%New()
    Set tMapping1.IrisUsername = "UNIQUETEST"
    Set tMapping1.DisplayName = "First User"
    Set tSC = tMapping1.%Save()
    Do $$$AssertStatusOK(tSC, "First mapping should save successfully")
    Set tId1 = tMapping1.%Id()

    Set tMapping2 = ##class(SpectraSight.Model.UserMapping).%New()
    Set tMapping2.IrisUsername = "UNIQUETEST"
    Set tMapping2.DisplayName = "Second User"
    Set tSC2 = tMapping2.%Save()
    Do $$$AssertTrue($$$ISERR(tSC2), "Second mapping with same username should fail")

    Do ##class(SpectraSight.Model.UserMapping).%DeleteId(tId1)
    Quit $$$OK
}

Method TestUserMappingDefaults() As %Status
{
    Set tMapping = ##class(SpectraSight.Model.UserMapping).%New()
    Set tMapping.IrisUsername = "DEFAULTTEST"
    Set tMapping.DisplayName = "Default Test"
    Do $$$AssertEquals(tMapping.IsActive, 1, "IsActive should default to 1")
    Do $$$AssertTrue(tMapping.CreatedAt '= "", "CreatedAt should be set on new")
    Do $$$AssertTrue(tMapping.UpdatedAt '= "", "UpdatedAt should be set on new")

    Set tSC = tMapping.%Save()
    Do $$$AssertStatusOK(tSC, "UserMapping should save")

    Set tId = tMapping.%Id()
    Do ##class(SpectraSight.Model.UserMapping).%DeleteId(tId)
    Quit $$$OK
}

Method TestUserMappingUpdate() As %Status
{
    Set tMapping = ##class(SpectraSight.Model.UserMapping).%New()
    Set tMapping.IrisUsername = "UPDATETEST"
    Set tMapping.DisplayName = "Before Update"
    Set tSC = tMapping.%Save()
    Do $$$AssertStatusOK(tSC, "UserMapping should save")

    Set tId = tMapping.%Id()
    Kill tMapping

    Hang 1.1

    Set tLoaded = ##class(SpectraSight.Model.UserMapping).%OpenId(tId)
    Set tFirstUpdate = tLoaded.UpdatedAt
    Set tLoaded.DisplayName = "After Update"
    Set tSC = tLoaded.%Save()
    Do $$$AssertStatusOK(tSC, "Update should succeed")
    Kill tLoaded

    Set tReloaded = ##class(SpectraSight.Model.UserMapping).%OpenId(tId)
    Do $$$AssertEquals(tReloaded.DisplayName, "After Update", "DisplayName should be updated")
    Do $$$AssertTrue(tReloaded.UpdatedAt '= tFirstUpdate, "UpdatedAt should change on save")

    Do ##class(SpectraSight.Model.UserMapping).%DeleteId(tId)
    Quit $$$OK
}

Method TestUserMappingDelete() As %Status
{
    Set tMapping = ##class(SpectraSight.Model.UserMapping).%New()
    Set tMapping.IrisUsername = "DELETETEST"
    Set tMapping.DisplayName = "Delete Me"
    Set tSC = tMapping.%Save()
    Do $$$AssertStatusOK(tSC, "UserMapping should save")

    Set tId = tMapping.%Id()
    Set tSC = ##class(SpectraSight.Model.UserMapping).%DeleteId(tId)
    Do $$$AssertStatusOK(tSC, "Delete should succeed")

    Set tDeleted = ##class(SpectraSight.Model.UserMapping).%OpenId(tId)
    Do $$$AssertTrue(tDeleted = "", "Deleted mapping should not be found")
    Quit $$$OK
}

}
